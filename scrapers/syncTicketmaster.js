import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { normaliseVenue } from './venueNormaliser.js'; 

// 1. SETUP ENVIRONMENT
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, '../');
dotenv.config({ path: path.join(rootPath, '.env') });

// 2. SETUP CLIENT
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TM_API_KEY = process.env.VITE_TICKETMASTER_KEY; 

if (!TM_API_KEY) {
    console.error("❌ ERROR: Could not find VITE_TICKETMASTER_KEY in .env file.");
    process.exit(1);
}

const SCRAPER_NAME = 'Ticketmaster_Bot_v1';
const MAX_PAGES_TO_SCAN = 5; 

// CONFIG: Date Window (30 Days)
const NOW = new Date();
const THIRTY_DAYS_LATER = new Date();
THIRTY_DAYS_LATER.setDate(NOW.getDate() + 30);

// Format for API: YYYY-MM-DDTHH:mm:ssZ
const startDateTime = NOW.toISOString().split('.')[0] + "Z";
const endDateTime = THIRTY_DAYS_LATER.toISOString().split('.')[0] + "Z";

const EXCLUDED_TERMS = [
  'santa', 'grotto', 'winter wonderland', 'elf', 'lapland', 
  'polar express', 'christmas experience', 'magical experience'
];

function getBestDescription(event) {
    const info = event.info || '';
    const pleaseNote = event.pleaseNote || '';
    const rawDesc = event.description || '';
    const isLikelyID = !rawDesc.includes(' ') && rawDesc.length < 20;
    const cleanDesc = isLikelyID ? '' : rawDesc;

    if (info) return info;
    if (cleanDesc) return cleanDesc;
    if (pleaseNote) return pleaseNote;

    if (event.classifications && event.classifications[0]) {
        const segment = event.classifications[0].segment?.name || '';
        const genre = event.classifications[0].genre?.name || '';
        if (segment && genre) return `${segment} Event - ${genre}`;
        if (segment) return `${segment} Event`;
    }
    return null; 
}

async function syncTicketmaster() {
  console.log(`🎟️ Starting ${SCRAPER_NAME}...`);
  const startTime = Date.now();

  let logId = null;
  const { data: logData, error: logError } = await supabase
    .from('scraper_logs')
    .insert([{ scraper_name: SCRAPER_NAME, status: 'running', items_fetched: 0 }])
    .select()
    .single();

  if (!logError) logId = logData.id;

  try {
    let totalAdded = 0;
    let totalSkipped = 0;
    let totalProcessed = 0;

    for (let page = 0; page < MAX_PAGES_TO_SCAN; page++) {
        console.log(`\n📄 Scanning Page ${page + 1} of ${MAX_PAGES_TO_SCAN}...`);
        
        // ADDED: startDateTime and endDateTime to fetch 1 month window
        const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TM_API_KEY}&locale=*&city=Dublin&countryCode=IE&sort=date,asc&size=100&page=${page}&startDateTime=${startDateTime}&endDateTime=${endDateTime}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`⚠️ TM API Error on page ${page}: ${response.status}`);
            continue; 
        }
        
        const data = await response.json();
        const events = data._embedded ? data._embedded.events : [];

        if (events.length === 0) {
            console.log('✅ No more events found.');
            break; 
        }

        for (const event of events) {
            totalProcessed++;

            if (!event.dates || !event.dates.start || !event.dates.start.dateTime) continue;

            const titleLower = event.name.toLowerCase();
            if (EXCLUDED_TERMS.some(term => titleLower.includes(term))) {
                totalSkipped++;
                continue;
            }

            const venueRaw = event._embedded && event._embedded.venues ? event._embedded.venues[0].name : 'Dublin Venue';
            const venueClean = normaliseVenue(venueRaw);
            const bestImage = event.images.sort((a, b) => b.width - a.width)[0]?.url || null;

            let category = 'event';
            if (event.classifications && event.classifications[0]) {
                const segment = event.classifications[0].segment.name.toLowerCase();
                if (segment.includes('music')) category = 'concert';
                else if (segment.includes('arts') || segment.includes('theatre')) category = 'theatre';
                else if (segment.includes('film')) category = 'film';
            }

            const eventData = {
                // ROBUST DEDUPE: Use Ticketmaster's ID
                external_id: event.id, 
                title: event.name,
                description: getBestDescription(event),
                start_date: event.dates.start.dateTime,
                venue: venueClean,
                image_url: bestImage,
                external_url: event.url,
                category: category,
                scraper_source: SCRAPER_NAME,
                // Explicitly set source for your display logic
                source: 'ticketmaster'
            };

            // D. ROBUST UPSERT CHECK
            // We check ONLY the external_id. 
            // This means if you change the venue name in the DB, this scraper won't overwrite it or create a dupe.
            const { data: existing } = await supabase
                .from('public_events')
                .select('id')
                .eq('external_id', eventData.external_id)
                .single();

            if (!existing) {
                const { error: insertError } = await supabase
                    .from('public_events')
                    .insert([eventData]);
                
                if (!insertError) {
                    totalAdded++;
                    console.log(`   ✨ Added: ${eventData.title}`);
                }
            } else {
                // Optional: Update data if needed, but usually we skip to preserve manual edits
                // console.log(`   Existing: ${eventData.title}`);
            }
        }
        
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n🚀 FINISHED! Processed ${totalProcessed} items.`);
    console.log(`   ✅ Added: ${totalAdded} new valid events.`);

    if (logId) {
        await supabase.from('scraper_logs').update({ 
          status: 'success', 
          items_fetched: totalAdded,
          duration_seconds: Math.round((Date.now() - startTime) / 1000)
        }).eq('id', logId);
    }

  } catch (err) {
    console.error('❌ Scrape failed:', err);
    if (logId) {
        await supabase.from('scraper_logs').update({ 
          status: 'error', 
          error_message: err.message 
        }).eq('id', logId);
    }
  }
}

syncTicketmaster();