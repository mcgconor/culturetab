import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { normaliseVenue } from './venueNormaliser.js'; // <--- NEW IMPORT

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

const SCRAPER_NAME = 'Journal_of_Music_Bot_v1';
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
  console.log(`🗞️  Starting ${SCRAPER_NAME}...`);
  const startTime = Date.now();

  let logId = null;
  const { data: logData, error: logError } = await supabase
    .from('scraper_logs')
    .insert([{ scraper_name: SCRAPER_NAME, status: 'running', items_fetched: 0 }])
    .select()
    .single();

  if (!logError) logId = logData.id;
  
  const baseUrl = 'https://journalofmusic.com/listings/events';
  const eventLinks = [];

  try {
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
              venue: venueText, // We keep raw here for filtering, normalize later
              title: title,
              listImage: listImage
            });
          }
        });
      } catch (e) { console.error(`List error: ${e.message}`); }
    }

    console.log(`\n🔍 Found ${eventLinks.length} Dublin events. Visiting details...`);
    const enrichedEvents = [];

    // STEP 2: VISIT EACH PAGE
    for (const link of eventLinks) {
      try {
        const res = await fetch(link.url);
        const html = await res.text();
        const $ = cheerio.load(html);

        let fullTitle = $('h1#page-title').text().trim() || $('h1.title').text().trim() || link.title;
        let description = $('.field-name-body .field-item').text().trim();
        if (description.length > 600) description = description.substring(0, 600) + '...';

        const dateAttr = $('.date-display-single').attr('content') || $('.date-display-start').attr('content');
        const isoDate = dateAttr ? new Date(dateAttr).toISOString() : new Date().toISOString();

        let finalImage = $('.field-name-field-image img').attr('src') || link.listImage;
        if (finalImage && finalImage.startsWith('/')) finalImage = `https://journalofmusic.com${finalImage}`;

        // Link Finder
        let external_url = link.url;
        const fieldLink = $('.field-name-field-website a').attr('href') || 
                          $('.field-name-field-booking-url a').attr('href') || 
                          $('.field-name-field-tickets a').attr('href');
        const textLink = $('a').filter((i, el) => {
          const t = $(el).text().trim().toLowerCase();
          return t === 'website' || t === 'booking' || t === 'tickets';
        }).attr('href');

        if (textLink) external_url = textLink;
        else if (fieldLink) external_url = fieldLink;

        enrichedEvents.push({
          title: fullTitle,
          description: description,
          start_date: isoDate,
          // --- NEW: Apply Normaliser ---
          venue: normaliseVenue(link.venue),
          image_url: finalImage,
          external_url: external_url, 
          category: 'concert',
          scraper_source: SCRAPER_NAME
        });

        await new Promise(r => setTimeout(r, 200));

      } catch (err) { console.error(`   ❌ Failed to scrape detail: ${link.url}`); }
    }

    // STEP 3: UPSERT
    console.log(`\n💾 Syncing ${enrichedEvents.length} events...`);
    let newCount = 0;
    for (const event of enrichedEvents) {
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

    console.log(`🚀 Success! Added ${newCount} new events.`);

    if (logId) {
        await supabase.from('scraper_logs').update({ 
          status: 'success', 
          items_fetched: newCount,
          duration_seconds: Math.round((Date.now() - startTime) / 1000)
        }).eq('id', logId);
    }

  } catch (err) {
    console.error('❌ Scrape Failed:', err);
    if (logId) {
        await supabase.from('scraper_logs').update({ status: 'error', error_message: err.message }).eq('id', logId);
    }
  }
}

scrapeDeep();