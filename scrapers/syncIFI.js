import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; 

// 1. ROBUST ENV LOADING
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, '../');
dotenv.config({ path: path.join(rootPath, '.env') });

// 2. SETUP CLIENT & KEYS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY; // Ensure this is in your .env
const IFI_BASE_URL = 'https://ifi.ie';
const SCRAPER_NAME = 'IFI_Bot_v1';

// --- TMDB HELPER FUNCTION ---
async function fetchTMDBData(title) {
    if (!TMDB_API_KEY) return null;
    
    try {
        // clean title (remove brackets e.g. "Nosferatu (1922)")
        const cleanTitle = title.split('(')[0].trim();
        
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
        const res = await fetch(searchUrl);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const movie = data.results[0]; // Take best match
            return {
                image_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                description: movie.overview
            };
        }
    } catch (err) {
        console.error(`   ⚠️ TMDB lookup failed for "${title}":`, err.message);
    }
    return null;
}

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
    const titlesToEnrich = new Set(); // To track unique titles for TMDB lookup

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

            titlesToEnrich.add(title);
            
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
                    image_url: null, // Placeholder
                    description: null // Placeholder
                });
            });
        }
    });

    console.log(`\n🍿 Querying TMDB for ${titlesToEnrich.size} unique titles...`);
    
    // STEP 2: ENRICH WITH TMDB
    const enrichmentMap = {};
    for (const title of titlesToEnrich) {
        const tmdbData = await fetchTMDBData(title);
        if (tmdbData) {
            enrichmentMap[title] = tmdbData;
        }
        // Small delay to be polite to TMDB API
        await new Promise(r => setTimeout(r, 100)); 
    }
    
    // STEP 3: MERGE DATA
    const finalScreenings = screenings.map(s => {
        const extra = enrichmentMap[s.title];
        return {
            ...s,
            image_url: extra?.image_url || s.image_url, // Prefer TMDB, fallback to null
            description: extra?.description || `Screening at IFI: ${s.title}`,
        };
    });

    if (finalScreenings.length === 0) {
      console.log('⚠️ No IFI screenings found.');
      return;
    }

    console.log(`✅ Found ${finalScreenings.length} screenings. Syncing...`);

    // STEP 4: UPSERT
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

    // 5. SUCCESS LOG
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