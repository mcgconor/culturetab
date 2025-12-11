import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. SETUP
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, '../');
dotenv.config({ path: path.join(rootPath, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- CONFIGURATION ---
const SCRAPER_NAME = 'Template_Bot_v1'; 

async function runScraper() {
  console.log(`🤖 Starting ${SCRAPER_NAME}...`);
  const startTime = Date.now();
  
  // 2. START LOG
  const { data: log } = await supabase
    .from('scraper_logs')
    .insert([{ scraper_name: SCRAPER_NAME, status: 'running', items_fetched: 0 }])
    .select()
    .single();

  try {
    // 3. YOUR SCRAPING LOGIC GOES HERE
    // Fetch data from API or HTML...
    // Map it to: { title, venue, start_date, external_url, category, scraper_source: SCRAPER_NAME }
    const events = []; 
    // ... logic to populate events ...

    console.log(`🔍 Found ${events.length} events.`);

    // 4. UPSERT TO DATABASE
    let newCount = 0;
    for (const event of events) {
      // Use upsert to avoid duplicates. 
      // Note: You need a unique constraint on (title, venue, start_date) for this to work perfectly, 
      // otherwise, use .select() check like we did in test-scraper.js
      const { data: existing } = await supabase
        .from('public_events')
        .select('id')
        .eq('title', event.title)
        .eq('venue', event.venue)
        .eq('start_date', event.start_date.toISOString()) // exact match
        .single();

      if (!existing) {
        await supabase.from('public_events').insert([event]);
        newCount++;
      }
    }

    // 5. SUCCESS LOG
    await supabase.from('scraper_logs').update({ 
      status: 'success', 
      items_fetched: newCount,
      duration_seconds: Math.round((Date.now() - startTime) / 1000)
    }).eq('id', log.id);

    console.log(`✅ ${SCRAPER_NAME} Complete! Added ${newCount} new events.`);

  } catch (err) {
    console.error("❌ Failed:", err);
    await supabase.from('scraper_logs').update({ 
      status: 'error', 
      error_message: err.message 
    }).eq('id', log.id);
  }
}

runScraper();