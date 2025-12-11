import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('🕵️‍♀️ Checking Database Records for Journal of Music...');

  const { data, error } = await supabase
    .from('public_events')
    .select('title, image_url, id')
    .eq('source', 'journalofmusic')
    .limit(5);

  if (error) {
    console.error('DB Error:', error);
    return;
  }

  if (data.length === 0) {
    console.log('❌ No Journal of Music events found in DB.');
    return;
  }

  console.log('\n--- LATEST 5 EVENTS ---');
  data.forEach((event, i) => {
    console.log(`\nEvent ${i + 1}:`);
    console.log(`Title: "${event.title}"`);
    console.log(`Image: ${event.image_url ? `"${event.image_url}"` : '❌ NULL / EMPTY'}`);
    console.log(`ID:    ${event.id}`);
  });
}

check();