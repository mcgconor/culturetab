import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // Standard fetch for Node environments

// 1. ROBUST ENV LOADING
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, '../');
dotenv.config({ path: path.join(rootPath, '.env') });

// 2. SETUP CLIENT
// Use the Service Role Key to bypass RLS policies
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TM_API_KEY = process.env.VITE_TICKETMASTER_KEY;
const SCRAPER_NAME = 'Ticketmaster_Bot_v1';

// Dublin-specific Ticketmaster URL
const TM_URL = `https://app.ticketmaster.com/discovery/v2/events.json?city=Dublin&sort=date,asc&size=100&apikey=${TM_API_KEY}`;

// Helper: Map Ticketmaster categories to our Dashboard categories
const mapCategory = (tmSegment) => {
  const seg = (tmSegment || '').toLowerCase();
  if (seg.includes('music')) return 'concert';
  if (seg.includes('theatre') || seg.includes('arts')) return 'theatre';
  if (seg.includes('film')) return 'film';
  return 'other';
};

async function sync() {
  console.log(`🎫 Starting ${SCRAPER_NAME}...`);
  const startTime = Date.now();
  
  // 3. START LOGGING
  let logId = null;
  const { data: logData, error: logError } = await supabase
    .from('scraper_logs')
    .insert([{ 
      scraper_name: SCRAPER_NAME, 
      status: 'running', 
      items_fetched: 0 
    }])
    .select()
    .single();

  if (logError) {
    console.error("❌ Failed to create log entry:", logError);
    return; // Stop if we can't log
  }
  logId = logData.id;

  try {
    // 4. FETCH DATA
    const res = await fetch(TM_URL);
    if (!res.ok) throw new Error(`Ticketmaster API Error: ${res.statusText}`);
    
    const data = await res.json();
    const events = data._embedded?.events || [];
    
    console.log(`🔍 Found ${events.length} raw events.`);

    // 5. FORMAT DATA
    const formattedEvents = events.map(e => ({
      title: e.name,
      // Fallback to localDate if dateTime is missing (e.g. all-day events)
      start_date: e.dates.start.dateTime || `${e.dates.start.localDate}T00:00:00Z`, 
      venue: e._embedded?.venues?.[0]?.name || 'TBA',
      image_url: e.images?.find(i => i.width > 600)?.url || e.images?.[0]?.url,
      external_url: e.url,
      category: mapCategory(e.classifications?.[0]?.segment?.name),
      scraper_source: SCRAPER_NAME, // <--- Important for Admin filtering
      description: `Ticketmaster Event ID: ${e.id}` // Storing TM ID in description for reference
    }));

    // 6. UPSERT (Insert only if unique)
    // We check (title + venue + start_date) to prevent duplicates
    let newCount = 0;
    
    for (const event of formattedEvents) {
      // Check if exists
      const { data: existing } = await supabase
        .from('public_events')
        .select('id')
        .eq('title', event.title)
        .eq('venue', event.venue)
        .eq('start_date', event.start_date)
        .single();

      if (!existing) {
        const { error: insertError } = await supabase
          .from('public_events')
          .insert([event]);
        
        if (insertError) {
          console.error(`⚠️ Error inserting "${event.title}":`, insertError.message);
        } else {
          newCount++;
        }
      }
    }

    console.log(`✅ Synced ${newCount} new events.`);

    // 7. SUCCESS LOG
    await supabase.from('scraper_logs').update({ 
      status: 'success', 
      items_fetched: newCount,
      duration_seconds: Math.round((Date.now() - startTime) / 1000)
    }).eq('id', logId);

  } catch (err) {
    console.error('❌ Script failed:', err);
    // 8. ERROR LOG
    if (logId) {
      await supabase.from('scraper_logs').update({ 
        status: 'error', 
        error_message: err.message 
      }).eq('id', logId);
    }
  }
}

sync();