import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// DUBLIN KEYWORDS
const DUBLIN_LOCATIONS = [
  'Dublin', 'Dún Laoghaire', 'Dun Laoghaire', 'Belfield', 'Blackrock', 
  'Tallaght', 'Rathmines', 'Smithfield', 'Temple Bar', 'Phibsborough',
  'National Concert Hall', 'NCH', "Whelan's", 'Vicar Street', 
  'The Sugar Club', 'Button Factory', 'Workman\'s Club', 'Grand Social',
  'Academy', '3Arena', 'Bord Gáis', 'Smock Alley', 'Project Arts Centre',
  'Complex', 'Unitarian Church', 'Pepper Canister', 'Helix', 'Pavilion Theatre',
  'Draíocht', 'Civic Theatre', 'Axis', 'Classon', 'Kevin Barry Room', 
  'Studio', 'Main Stage', 
  'RIAM', 'Royal Irish Academy of Music', 'Whyte Hall'
];

async function scrapeDeep() {
  console.log('🗞️  Starting Deep Scrape (Text-Search Mode)...');
  
  const baseUrl = 'https://journalofmusic.com/listings/events';
  const eventLinks = [];

  // STEP 1: GATHER LINKS
  for (let i = 0; i < 3; i++) {
    const url = i === 0 ? baseUrl : `${baseUrl}?page=${i}`;
    console.log(`📄 Scanning List Page ${i + 1}...`);
    
    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      $('.view-content .views-row').each((_, el) => {
        const venueText = $(el).find('.views-field-field-venue .field-content').text().trim();
        const title = $(el).find('.views-field-title a').text().trim();
        const relativeLink = $(el).find('.views-field-title a').attr('href');
        const listImage = $(el).find('img').attr('src'); 

        const isDublin = DUBLIN_LOCATIONS.some(k => venueText.toLowerCase().includes(k.toLowerCase()));
        
        if (isDublin && relativeLink && title) {
          eventLinks.push({
            url: `https://journalofmusic.com${relativeLink}`,
            venue: venueText,
            title: title,
            listImage: listImage,
            id: `jom-${relativeLink.split('/').pop()}`
          });
        }
      });
    } catch (e) { console.error(`List error: ${e}`); }
  }

  console.log(`\n🔍 Found ${eventLinks.length} Dublin events. Visiting details...`);
  const enrichedEvents = [];

  // STEP 2: VISIT EACH PAGE
  for (const link of eventLinks) {
    try {
      const res = await fetch(link.url);
      const html = await res.text();
      const $ = cheerio.load(html);

      // TITLE & DESCRIPTION
      let fullTitle = $('h1#page-title').text().trim() || $('h1.title').text().trim() || link.title;
      let description = $('.field-name-body .field-item').text().trim();
      if (description.length > 600) description = description.substring(0, 600) + '...';

      // DATE
      const dateAttr = $('.date-display-single').attr('content') || $('.date-display-start').attr('content');
      const isoDate = dateAttr ? new Date(dateAttr).toISOString() : new Date().toISOString();

      // IMAGE
      let finalImage = $('.field-name-field-image img').attr('src') || link.listImage;
      if (finalImage && finalImage.startsWith('/')) finalImage = `https://journalofmusic.com${finalImage}`;

      // --- SMART LINK FINDER ---
      // 1. Look for explicit Drupal fields (Backup)
      let external_url = link.url; // Default to JoM
      const fieldLink = $('.field-name-field-website a').attr('href') || 
                        $('.field-name-field-booking-url a').attr('href') || 
                        $('.field-name-field-tickets a').attr('href');

      // 2. Look for links by TEXT (The Fix)
      // We look for any link that says exactly "Website", "Booking", or "Tickets"
      const textLink = $('a').filter((i, el) => {
        const t = $(el).text().trim().toLowerCase();
        return t === 'website' || t === 'booking' || t === 'tickets';
      }).attr('href');

      // Prioritize: Text Link > Field Link > Journal Page
      if (textLink) external_url = textLink;
      else if (fieldLink) external_url = fieldLink;

      // -------------------------

      enrichedEvents.push({
        id: link.id,
        title: fullTitle,
        description: description,
        start_date: isoDate,
        venue: link.venue,
        image_url: finalImage,
        external_url: external_url, 
        category: 'music',
        source: 'journalofmusic'
      });

      await new Promise(r => setTimeout(r, 200));

    } catch (err) {
      console.error(`   ❌ Failed to scrape ${link.url}`);
    }
  }

  // STEP 3: SAVE
  if (enrichedEvents.length > 0) {
    console.log(`\n💾 Saving ${enrichedEvents.length} events...`);
    const { error } = await supabase.from('public_events').upsert(enrichedEvents, { onConflict: 'id' });
    if (error) console.error('DB Error:', error);
    else console.log('🚀 Success! Links updated.');
  }
}

scrapeDeep();