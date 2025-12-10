import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to Supabase with the Master Key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const TM_API_KEY = process.env.VITE_TICKETMASTER_KEY;
const TM_URL = `https://app.ticketmaster.com/discovery/v2/events.json?city=Dublin&sort=date,asc&size=100&apikey=${TM_API_KEY}&classificationId=KZFzniwnSyZfZ7v7nJ,KZFzniwnSyZfZ7v7na,KZFzniwnSyZfZ7v7nE`;

async function sync() {
  console.log('🎫 Fetching events from Ticketmaster...');
  
  try {
    const res = await fetch(TM_URL);
    const data = await res.json();
    const events = data._embedded?.events || [];
    
    console.log(`✅ Found ${events.length} events. Saving to Database...`);

    const formatted = events.map(e => ({
      id: e.id,
      title: e.name,
      start_date: e.dates.start.dateTime || `${e.dates.start.localDate}T00:00:00Z`,
      venue: e._embedded?.venues?.[0]?.name || 'TBA',
      image_url: e.images.find(i => i.width > 600)?.url || e.images[0].url,
      external_url: e.url,
      category: e.classifications?.[0]?.segment?.name?.toLowerCase() || 'other',
      source: 'ticketmaster'
    }));

    const { error } = await supabase.from('public_events').upsert(formatted, { onConflict: 'id' });

    if (error) console.error('❌ DB Error:', error);
    else console.log('🚀 Success! Events synced.');

  } catch (err) {
    console.error('Script failed:', err);
  }
}

sync();