import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { normaliseVenue } from './venueNormaliser.js';

// 1. ROBUST ENV LOADING
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
const SCRAPER_NAME = 'Ticketmaster_Bot_v1';
const TM_URL = `https://app.ticketmaster.com/discovery/v2/events.json?city=Dublin&sort=date,asc&size=100&apikey=${TM_API_KEY}`;

// --- NEW: BLOCKLIST ---
const BLOCKED_KEYWORDS = [
  'Car Pass',
  'CarPass',
  'Santa', // Catches "Santa's", "Santa", "Magical Santa"
  'Grotto',
  'Annual Pass',
];

// Helper: Map Ticketmaster categories
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
  
  let logId = null;
  const { data: logData, error: logError } = await supabase
    .from('scraper_logs')
    .insert([{ scraper_name: SCRAPER_NAME, status: 'running', items_fetched: 0 }])
    .select()
    .single();

  if (!logError) logId = logData.id;

  try {
    const res = await fetch(TM_URL);
    if (!res.ok) throw new Error(`Ticketmaster API Error: ${res.statusText}`);
    
    const data = await res.json();
    const rawEvents = data._embedded?.events || [];
    
    console.log(`🔍 Found ${rawEvents.length} raw events.`);

    // 3. FILTER & FORMAT
    const validEvents = rawEvents.filter(e => {
      // Check Blocklist
      const title = e.name || '';
      const isBlocked = BLOCKED_KEYWORDS.some(keyword => 
        title.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (isBlocked) {
        // Optional: Log what we skipped so you know it's working
        // console.log(`   🚫 Skipped blocked event: "${title}"`);
        return false;
      }
      return true;
    });

    const formattedEvents = validEvents.map(e => ({
      title: e.name,
      start_date: e.dates.start.dateTime || `${e.dates.start.localDate}T00:00:00Z`, 
      venue: normaliseVenue(e._embedded?.venues?.[0]?.name || 'TBA'), 
      image_url: e.images?.find(i => i.width > 600)?.url || e.images?.[0]?.url,
      external_url: e.url,
      category: mapCategory(e.classifications?.[0]?.segment?.name),
      scraper_source: SCRAPER_NAME,
      description: `Ticketmaster Event ID: ${e.id}`
    }));

    // 4. UPSERT
    let newCount = 0;
    for (const event of formattedEvents) {
      const { data: existing } = await supabase
        .from('public_events')
        .select('id')
        .eq('title', event.title)
        .eq('venue', event.venue)
        .eq('start_date', event.start_date)
        .single();

      if (!existing) {
        const { error: insertError } = await supabase.from('public_events').insert([event]);
        if (!insertError) newCount++;
      }
    }

    console.log(`✅ Synced ${newCount} new events (Filtered out ${rawEvents.length - validEvents.length} blocked).`);

    // 5. SUCCESS LOG
    if (logId) {
        await supabase.from('scraper_logs').update({ 
          status: 'success', 
          items_fetched: newCount,
          duration_seconds: Math.round((Date.now() - startTime) / 1000)
        }).eq('id', logId);
    }

  } catch (err) {
    console.error('❌ Script failed:', err);
    if (logId) {
      await supabase.from('scraper_logs').update({ 
        status: 'error', 
        error_message: err.message 
      }).eq('id', logId);
    }
  }
}

sync();