import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { normaliseVenue } from './venueNormaliser.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, '../');
dotenv.config({ path: path.join(rootPath, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SCRAPER_NAME = 'syncJournal.js'; // Updated to match Admin Dashboard expectations

// 🛑 1. IGNORED VENUES (Let specific scrapers handle these)
const IGNORED_VENUES = [
  'Abbey Theatre', 
  'Irish Film Institute', 
  'IFI',
  'National Concert Hall', 
  'NCH',
  'Bord Gáis Energy Theatre'
];

const DUBLIN_LOCATIONS = [
  'Dublin', 'Dún Laoghaire', 'Dun Laoghaire', 'Belfield', 'Blackrock', 
  'Tallaght', 'Rathmines', 'Smithfield', 'Temple Bar', 'Phibsborough',
  "Whelan's", 'Vicar Street', 'The Sugar Club', 'Button Factory', 'Workman\'s Club', 'Grand Social',
  'Academy', '3Arena', 'Bord Gáis', 'Smock Alley', 'Project Arts Centre',
  'Complex', 'Unitarian Church', 'Pepper Canister', 'Helix', 'Pavilion Theatre',
  'Draíocht', 'Civic Theatre', 'Axis', 'Classon', 'Kevin Barry Room', 
  'Studio', 'Main Stage', 'Gate Theatre', 'Gaiety', 'Olympia',
  'RIAM', 'Royal Irish Academy of Music', 'Whyte Hall', 'Hugh Lane', 'Chester Beatty',
  'IMMA', 'RHA', 'Science Gallery', 'MoLI', 'Croke Park', 'Aviva'
];

// --- HELPER: Upload to Supabase ---
async function uploadImageToSupabase(originalUrl, eventTitle) {
    if (!originalUrl) return null;
    try {
        const cleanTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
        const hash = Buffer.from(originalUrl).toString('base64').substring(0, 8);
        const fileName = `jom/${cleanTitle}_${hash}.jpg`;

        const { data: publicUrlData } = supabase.storage.from('event-images').getPublicUrl(fileName);
        
        const res = await fetch(originalUrl);
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();

        const { error } = await supabase.storage.from('event-images').upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: true
        });
        if (error) throw error;

        return publicUrlData.publicUrl;
    } catch (err) { return null; }
}

// --- HELPER: Check for Cross-Scraper Duplicates ---
async function isDuplicate(title, dateStr, venue) {
    if (!dateStr) return false;
    
    // Check 1: Is this a venue we ignore?
    if (IGNORED_VENUES.some(v => venue?.toLowerCase().includes(v.toLowerCase()))) return true;

    // Check 2: Database Check
    const startDate = new Date(dateStr);
    const dayStart = startDate.toISOString().split('T')[0] + 'T00:00:00';
    const dayEnd = startDate.toISOString().split('T')[0] + 'T23:59:59';

    const { data: existing } = await supabase
        .from('public_events')
        .select('title')
        .gte('start_date', dayStart)
        .lte('start_date', dayEnd);

    if (!existing || existing.length === 0) return false;

    // Fuzzy Title Match
    const cleanNew = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return existing.some(e => {
        const cleanDb = e.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanDb.includes(cleanNew) || cleanNew.includes(cleanDb);
    });
}

async function scrapeDeep() {
  console.log(`🗞️  Starting Journal of Music Sync...`);
  
  const baseUrl = 'https://journalofmusic.com/listings/events';
  const eventLinks = [];

  try {
    // 1. GATHER LINKS
    for (let i = 0; i < 5; i++) {
      const url = i === 0 ? baseUrl : `${baseUrl}?page=${i}`;
      console.log(`📄 Scanning List Page ${i + 1}...`);
      
      try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        $('.view-content .views-row').each((_, el) => {
          const venueText = $(el).find('.views-field-field-venue .field-content').text().trim();
          
          // 🛑 GUARD: Skip ignored venues immediately
          if (IGNORED_VENUES.some(v => venueText.toLowerCase().includes(v.toLowerCase()))) {
             return; 
          }

          const title = $(el).find('.views-field-title a').text().trim();
          const relativeLink = $(el).find('.views-field-title a').attr('href');
          
          let listImage = $(el).find('img').attr('src'); 
          if (listImage && listImage.startsWith('/')) listImage = `https://journalofmusic.com${listImage}`;

          const isDublin = DUBLIN_LOCATIONS.some(k => venueText.toLowerCase().includes(k.toLowerCase()));
          
          if (isDublin && relativeLink && title) {
            eventLinks.push({
              url: `https://journalofmusic.com${relativeLink}`,
              venue: venueText, 
              title: title, 
              listImage: listImage
            });
          }
        });
      } catch (e) { console.error(`List error: ${e.message}`); }
    }

    console.log(`\n🔍 Found ${eventLinks.length} Dublin events (excluding blocked venues). Visiting details...`);
    const enrichedEvents = [];

    // 2. VISIT DETAILS
    for (const link of eventLinks) {
      try {
        const res = await fetch(link.url);
        const html = await res.text();
        const $ = cheerio.load(html);

        let fullTitle = $('meta[property="og:title"]').attr('content') || $('h1#page-title').text().trim() || link.title;

        if (fullTitle && fullTitle.includes('The Journal of Music') && fullTitle.includes('News, Reviews')) {
            fullTitle = link.title;
        }

        let description = $('.field-name-body .field-item').text().trim() || 
                          $('.field-name-body').text().trim() || 
                          $('.node-content p').first().text().trim();

        if (description.length > 800) description = description.substring(0, 800) + '...';

        const dateAttr = $('.date-display-single').attr('content') || $('.date-display-start').attr('content');
        const isoDate = dateAttr ? new Date(dateAttr).toISOString() : new Date().toISOString();

        // 🛑 GUARD: Double check duplicate status (Title + Date + Venue)
        // This stops us from adding an event that syncAbbey.js or syncIFI.js already added
        if (await isDuplicate(fullTitle, isoDate, link.venue)) {
            // console.log(`   🚫 Duplicate skipped: ${fullTitle}`);
            continue;
        }

        // --- IMAGES ---
        let rawImage = $('meta[property="og:image"]').attr('content') || $('.field-name-field-image img').attr('src') || link.listImage;
        if (rawImage && rawImage.startsWith('/')) rawImage = `https://journalofmusic.com${rawImage}`;
        if (rawImage && rawImage.includes('?')) rawImage = rawImage.split('?')[0];

        let hostedImageUrl = null;
        if (rawImage) {
            hostedImageUrl = await uploadImageToSupabase(rawImage, fullTitle);
        }

        // --- EXTERNAL LINK ---
        let external_url = null;
        $('a').each((i, el) => {
            const text = $(el).text().toLowerCase().trim();
            const href = $(el).attr('href');
            if (href && !href.startsWith('/') && !href.startsWith('#')) {
                if (text === 'website' || text === 'booking' || text === 'tickets' || text.includes('book tickets')) {
                    external_url = href;
                    return false; 
                }
            }
        });
        if (!external_url) {
             external_url = $('.field-name-field-website a').attr('href') || 
                            $('.field-name-field-booking-url a').attr('href');
        }
        if (!external_url) external_url = link.url;

        const externalId = Buffer.from(link.url).toString('base64');

        enrichedEvents.push({
          external_id: externalId,
          title: fullTitle,
          description: description,
          start_date: isoDate,
          venue: normaliseVenue(link.venue),
          image_url: hostedImageUrl, 
          external_url: external_url, 
          category: 'Music', // Normalised to 'Music' for the app
          scraper_source: SCRAPER_NAME, // ✅ Matches Admin Dashboard
          source: 'journal_of_music' 
        });

        // Small delay to be polite
        await new Promise(r => setTimeout(r, 100));

      } catch (err) { console.error(`   ❌ Failed: ${link.url}`); }
    }

    // 3. SYNC
    console.log(`\n💾 Syncing ${enrichedEvents.length} unique events...`);
    let newCount = 0;
    
    for (const event of enrichedEvents) {
        // Upsert based on external_id (JOM-specific)
        const { data: existing } = await supabase
            .from('public_events')
            .select('id, title, description, image_url, external_url')
            .eq('external_id', event.external_id)
            .single();

        if (!existing) {
            const { error: insertError } = await supabase.from('public_events').insert([event]);
            if (!insertError) {
                newCount++;
                console.log(`   ✨ Added: ${event.title}`);
            }
        } else {
            // FORCE UPDATE logic (Keep user's logic)
            const updates = {};
            
            // Fix Bad Titles (Site Name bug)
            if (existing.title.includes('The Journal of Music') && !event.title.includes('The Journal of Music')) {
                updates.title = event.title;
            }
            // Update if we found a better/longer title
            else if (event.title.length > existing.title.length && !event.title.includes('The Journal of Music')) {
                updates.title = event.title;
            }

            // Ensure scraper_source is updated so it appears in Admin
            updates.scraper_source = SCRAPER_NAME; 

            if (Object.keys(updates).length > 0) {
                await supabase.from('public_events').update(updates).eq('id', existing.id);
                console.log(`   🔄 Fixed Data for: ${event.title}`);
            }
        }
    }

    console.log(`🚀 Success! Added ${newCount} new events.`);

  } catch (err) {
    console.error('❌ Scrape Failed:', err);
  }
}

scrapeDeep();