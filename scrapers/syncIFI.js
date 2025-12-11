import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // Ensure fetch works in Node

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

const IFI_BASE_URL = 'https://ifi.ie';
const SCRAPER_NAME = 'IFI_Bot_v1';

/**
 * Parses textual day header (e.g., "TUESDAY DECEMBER 9TH") into YYYY-MM-DD
 */
function parseDayString(dayString) {
    const parts = dayString.split(' ');
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
 * Deep scrape for poster and description
 */
async function scrapeDetail(detailUrl) {
    try {
        const response = await fetch(detailUrl);
        const html = await response.text();
        const $ = cheerio.load(html);

        const imageSrc = $('.film-poster img').attr('src') || $('.film-details img').attr('src');
        let description = $('.synopsis p').first().text().trim();
        if (description.length > 500) description = description.substring(0, 500) + '...';

        let finalImage = imageSrc;
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
  console.log(`🎬 Starting ${SCRAPER_NAME}...`);
  const startTime = Date.now();
  
  // 3. START LOGGING
  let logId = null;
  const { data: logData, error: logError } = await supabase
    .from('scraper_logs')
    .insert([{ scraper_name: SCRAPER_NAME, status: 'running', items_fetched: 0 }])
    .select()
    .single();

  if (!logError) logId = logData.id;

  try {
    const response = await fetch(`${IFI_BASE_URL}/weekly-schedule`);
    const html = await response.text();
    const $ = cheerio.load(html);

    let currentDayDateStr = null;
    const screenings = [];
    const detailLinksToScrape = []; 

    const dateRegex = /(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)/i;

    // STEP 1: SCAN SCHEDULE
    $('.btmblock.clearfix *').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length === 0) return;

        if (text.includes('DAY') && dateRegex.test(text)) {
            currentDayDateStr = parseDayString(text);
            return;
        }

        if (currentDayDateStr && text.includes('–')) {
            const parts = text.split('–', 2).map(s => s.trim());
            const rawTitle = parts[0];
            const rawTimes = parts[1];
            
            if (!rawTimes || !rawTimes.match(/\d{2}\.\d{2}/)) return;

            const titleElement = $(el).find('a').first();
            const detailLink = titleElement.attr('href');
            const title = rawTitle.split('(')[0].trim();
            const timesList = rawTimes.split(',');

            if (detailLink) {
                 const fullLink = detailLink.startsWith('http') ? detailLink : `${IFI_BASE_URL}${detailLink}`;
                 if (!detailLinksToScrape.some(item => item.fullLink === fullLink)) {
                    detailLinksToScrape.push({ fullLink, title });
                 }
            }
            
            timesList.forEach(timeNote => {
                const timeMatch = timeNote.match(/(\d{2}\.\d{2})/);
                if (!timeMatch) return;
                
                const time = timeMatch[0].replace('.', ':'); 
                const fullDateTime = `${currentDayDateStr}T${time}:00`;

                // URL Cleanup
                let external_url = detailLink || `${IFI_BASE_URL}/weekly-schedule`;
                if (external_url.startsWith('/') && !external_url.startsWith('//')) {
                    external_url = `${IFI_BASE_URL}${external_url}`;
                }

                screenings.push({
                    title: title,
                    start_date: fullDateTime,
                    venue: 'Irish Film Institute (IFI)',
                    category: 'film',
                    scraper_source: SCRAPER_NAME,
                    external_url: external_url,
                });
            });
        }
    });

    console.log(`\n🖼️ Deep scraping ${detailLinksToScrape.length} film pages...`);
    const detailData = {};
    for (const link of detailLinksToScrape) {
        const data = await scrapeDetail(link.fullLink);
        detailData[link.title] = data; 
    }
    
    // STEP 2: MERGE DATA
    const finalScreenings = screenings.map(s => ({
        ...s,
        image_url: detailData[s.title]?.image_url || null, 
        description: detailData[s.title]?.description || null,
    }));

    if (finalScreenings.length === 0) {
      console.log('⚠️ No IFI screenings found.');
      return;
    }

    console.log(`✅ Found ${finalScreenings.length} screenings. Syncing...`);

    // STEP 3: UPSERT (Using Title + StartDate check)
    let newCount = 0;
    for (const event of finalScreenings) {
        const { data: existing } = await supabase
            .from('public_events')
            .select('id')
            .eq('title', event.title)
            .eq('venue', event.venue)
            .eq('start_date', event.start_date)
            .single();

        if (!existing) {
            const { error: insertError } = await supabase
                .from('public_events')
                .insert([event]);
            
            if (!insertError) newCount++;
        }
    }

    console.log(`🚀 Success! Added ${newCount} new IFI screenings.`);

    // 4. SUCCESS LOG
    if (logId) {
        await supabase.from('scraper_logs').update({ 
          status: 'success', 
          items_fetched: newCount,
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

scrapeIFI();