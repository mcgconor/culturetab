import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const IFI_BASE_URL = 'https://ifi.ie';

/**
 * Parses a textual day header (e.g., "TUESDAY DECEMBER 9TH") into a standard YYYY-MM-DD format.
 */
function parseDayString(dayString) {
    const parts = dayString.split(' ');
    
    // Day: Strip non-numeric suffixes
    const day = parseInt(parts[2].replace(/\D/g, ''), 10); 
    const month = parts[1];
    
    let year = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();
    const monthIndex = new Date(Date.parse(month + " 1, " + year)).getMonth();

    if (monthIndex < currentMonthIndex && currentMonthIndex > 9) {
        year++;
    }
    
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Scrapes the detail page for the poster image and short description.
 */
async function scrapeDetail(detailUrl) {
    try {
        const response = await fetch(detailUrl);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Find the film poster image (common selector on IFI detail pages)
        const imageSrc = $('.film-poster img').attr('src') || $('.film-details img').attr('src');
        
        // Find the main synopsis/description (common selector)
        let description = $('.synopsis p').first().text().trim();
        if (description.length > 500) description = description.substring(0, 500) + '...';

        let finalImage = imageSrc;
        
        // FIX IMAGE URL: Only prepend if it starts with a single slash
        if (finalImage && finalImage.startsWith('/')) {
            finalImage = `${IFI_BASE_URL}${finalImage}`;
        }

        return { image_url: finalImage, description };

    } catch (e) {
        console.error(`   Failed to fetch detail for ${detailUrl}`);
        return { image_url: null, description: null };
    }
}


async function scrapeIFI() {
  console.log('🎬 Starting IFI Deep Scrape...');
  
  try {
    const response = await fetch(`${IFI_BASE_URL}/weekly-schedule`);
    const html = await response.text();
    const $ = cheerio.load(html);

    let currentDayDateStr = null;
    const screenings = [];
    const detailLinksToScrape = []; // Array to store unique film detail links

    const dateRegex = /(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)/i;

    // STEP 1: SCAN SCHEDULE AND GATHER LINKS
    $('.btmblock.clearfix *').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length === 0) return;

        // Check for Day Header
        if (text.includes('DAY') && dateRegex.test(text)) {
            currentDayDateStr = parseDayString(text);
            return;
        }

        // Check for Showtime Line
        if (currentDayDateStr && text.includes('–')) {
            const parts = text.split('–', 2).map(s => s.trim());
            const rawTitle = parts[0];
            const rawTimes = parts[1];
            
            if (!rawTimes || !rawTimes.match(/\d{2}\.\d{2}/)) return;

            const titleElement = $(el).find('a').first();
            const detailLink = titleElement.attr('href');
            
            const title = rawTitle.split('(')[0].trim();
            const timesList = rawTimes.split(',');

            // Add the unique film link for Step 2
            if (detailLink) {
                 const fullLink = detailLink.startsWith('http') ? detailLink : `${IFI_BASE_URL}${detailLink}`;
                 if (!detailLinksToScrape.some(item => item.fullLink === fullLink)) {
                    detailLinksToScrape.push({ fullLink, title });
                 }
            }
            
            // Create screening entries
            timesList.forEach(timeNote => {
                const timeMatch = timeNote.match(/(\d{2}\.\d{2})/);
                if (!timeMatch) return;
                
                const time = timeMatch[0].replace('.', ':'); 
                const fullDateTime = `${currentDayDateStr}T${time}:00`;
                const uniqueId = `ifi-${title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}-${currentDayDateStr}-${time}`;

                // Fix External URL before saving
                let external_url = detailLink || `${IFI_BASE_URL}/weekly-schedule`;
                
                // CRITICAL FIX: Only prepend IFI_BASE_URL if the link is relative (starts with /)
                if (external_url.startsWith('/') && !external_url.startsWith('//')) {
                    external_url = `${IFI_BASE_URL}${external_url}`;
                } else if (external_url.startsWith('http') && external_url.includes(IFI_BASE_URL)) {
                    // Fix the broken double-prefix from previous run by ensuring it only starts with one
                    external_url = external_url.replace(IFI_BASE_URL, IFI_BASE_URL); 
                }
                
                screenings.push({
                    id: uniqueId,
                    title: title,
                    start_date: fullDateTime,
                    venue: 'Irish Film Institute (IFI)',
                    category: 'film',
                    source: 'ifi',
                    external_url: external_url,
                });
            });
        }
    });

    // STEP 2: DEEP SCRAPE FOR POSTER AND DESCRIPTION
    console.log(`\n🖼️ Deep scraping ${detailLinksToScrape.length} film detail pages for posters...`);
    const detailData = {};
    for (const link of detailLinksToScrape) {
        const data = await scrapeDetail(link.fullLink);
        detailData[link.title] = data; // Store data keyed by film title
    }
    
    // STEP 3: MERGE AND SAVE
    const finalScreenings = screenings.map(s => ({
        ...s,
        // Match the screening to the detail data by Title
        image_url: detailData[s.title]?.image_url || null, 
        description: detailData[s.title]?.description || null,
    }));

    if (finalScreenings.length === 0) {
      console.log('⚠️ No IFI screenings found.');
      return;
    }

    console.log(`✅ Found and enriched ${finalScreenings.length} screenings. Syncing...`);

    const { error } = await supabase
      .from('public_events')
      .upsert(finalScreenings, { onConflict: 'id' });

    if (error) console.error('❌ DB Error:', error);
    else console.log('🚀 Success! IFI images and links fixed.');

  } catch (err) {
    console.error('Scrape failed:', err);
  }
}

scrapeIFI();