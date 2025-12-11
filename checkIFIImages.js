import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkIFIImages() {
  console.log('🕵️‍♀️ Checking Database Records for IFI Images...');

  // Fetch the last 5 IFI events
  const { data, error } = await supabase
    .from('public_events')
    .select('title, image_url, id')
    .eq('source', 'ifi')
    .order('start_date', { ascending: false })
    .limit(5);

  if (error) {
    console.error('DB Error:', error);
    return;
  }

  if (data.length === 0) {
    console.log('❌ No IFI events found in DB.');
    return;
  }

  console.log('\n--- LATEST 5 IFI IMAGE URLS ---');
  data.forEach((event, i) => {
    console.log(`\nScreening ${i + 1}:`);
    console.log(`Title: "${event.title}"`);
    console.log(`Image: ${event.image_url ? `"${event.image_url}"` : '❌ NULL / MISSING'}`);
    
    // If an image URL is present, provide a link to verify it loads in the browser
    if (event.image_url) {
        console.log(`Verify URL: Paste this into your browser: ${event.image_url}`);
    }
  });
}

checkIFIImages();