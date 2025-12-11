import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// TMDb Constants
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; 

async function enrichIFI() {
  if (!TMDB_API_KEY) {
    console.error('❌ TMDb API Key is missing. Cannot enrich data.');
    return;
  }

  console.log('✨ Starting TMDb Enrichment (Omitting Generated Column)...');

  // 1. Fetch all IFI events that are missing an image (Fetch ALL fields for safe upsert)
  const { data: rawEvents, error: fetchError } = await supabase
    .from('public_events')
    .select('*') 
    .eq('source', 'ifi')
    .is('image_url', null); 

  if (fetchError) {
    console.error('❌ Supabase Fetch Error:', fetchError);
    return;
  }

  if (rawEvents.length === 0) {
    console.log('👍 No IFI events need enrichment.');
    return;
  }
  
  const uniqueTitles = [...new Set(rawEvents.map(e => e.title))];
  console.log(`🎬 Found ${uniqueTitles.length} unique films to enrich.`);

  const enrichmentDataMap = new Map(); 
  const eventsToUpdate = []; 

  for (const title of uniqueTitles) {
    if (enrichmentDataMap.has(title)) continue; 

    // 2. Search TMDb API
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      const bestMatch = data.results && data.results.length > 0 ? data.results[0] : null;

      if (bestMatch && bestMatch.poster_path) {
        const posterUrl = `${TMDB_IMAGE_BASE_URL}${bestMatch.poster_path}`;
        const synopsis = bestMatch.overview || null;
        
        enrichmentDataMap.set(title, { image_url: posterUrl, description: synopsis });
        console.log(`   Fetched poster for: ${title}`);

      } else {
        enrichmentDataMap.set(title, { image_url: null, description: null }); 
        console.log(`   ❌ No poster found for: ${title}`);
      }

    } catch (apiError) {
      console.error(`❌ TMDb API Error for ${title}:`, apiError.message);
      enrichmentDataMap.set(title, { image_url: null, description: null });
    }
  }

  // 4. Merge and Finalize Update Batch
  for (const event of rawEvents) {
      const enrichment = enrichmentDataMap.get(event.title);
      
      if (enrichment && enrichment.image_url) { 
          const updatePayload = {
              ...event, // Spread ALL existing fields
              image_url: enrichment.image_url, // Overwrite image_url
              description: enrichment.description || event.description, // Overwrite description
          };
          
          // --- THE FINAL FIX: OMIT THE GENERATED COLUMN ---
          delete updatePayload.fts; 
          
          eventsToUpdate.push(updatePayload);
      }
  }

  // 5. Write enriched data back to Supabase
  if (eventsToUpdate.length > 0) {
    console.log(`\n💾 Updating ${eventsToUpdate.length} screenings with TMDb data...`);
    
    const { error: updateError } = await supabase
      .from('public_events')
      .upsert(eventsToUpdate, { onConflict: 'id' }); 

    if (updateError) console.error('❌ Supabase Update Error:', updateError);
    else console.log('🚀 Enrichment complete! IFI Images are live.');
  } else {
    console.log('No new data to update.');
  }
}

enrichIFI();