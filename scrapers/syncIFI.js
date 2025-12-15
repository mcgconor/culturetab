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

const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY; 
const IFI_BASE_URL = 'https://ifi.ie';
const SCRAPER_NAME = 'IFI_Bot_v1';

async function fetchTMDBData(title) {
    if (!TMDB_API_KEY) return null;
    try {
        const cleanTitle = title.split('(')[0].trim();
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
        const res = await fetch(searchUrl);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const movie = data.results[0]; 
            return {
                image_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                description: movie.overview
            };
        }
    } catch (err) {}
    return null;
}

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
  
  let logId = null;
  const { data: logData, error: logError } = await supabase
    .from('scraper_logs')
    .insert([{ scraper_name: SCRAPER_NAME, status: 'running', items_fetched: 0 }])
    .select()
    .single();

  if (!logError) logId = logData.id;

  const IFI_CANONICAL_VENUE = normaliseVenue("Irish Film Institute (IFI)"); 
  
  try {
    const response = await fetch(`${IFI_BASE_URL}/weekly-schedule`);
    const html = await response.text();
    const $ = cheerio.load(html);

    let currentDayDateStr = null;
    const screenings = [];
    const titlesToEnrich = new Set(); 
    const dateRegex = /(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)/i;

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

            const title = rawTitle.split('(')[0].trim();
            const timesList = rawTimes.split(',');
            titlesToEnrich.add(title);
            
            timesList.forEach(timeNote => {
                const timeMatch = timeNote.match(/(\d{2}\.\d{2})/);
                if (!timeMatch) return;
                
                const time = timeMatch[0].replace('.', ':'); 
                const fullDateTime = `${currentDayDateStr}T${time}:00`;

                // Create a unique hash for ID: "Title + Date" in Base64
                // This ensures if IFI updates the schedule, we know it's the same screening
                const uniqueString = `${title}_${fullDateTime}_IFI`;
                const externalId = Buffer.from(uniqueString).toString('base64');

                let external_url = `${IFI_BASE_URL}/weekly-schedule`; // Default

                screenings.push({
                    external_id: externalId, // ROBUST ID
                    title: title,
                    start_date: fullDateTime,
                    venue: IFI_CANONICAL_VENUE, 
                    category: 'film',
                    scraper_source: SCRAPER_NAME,
                    external_url: external_url,
                    source: 'ifi', // Explicit source
                    image_url: null, 
                    description: null 
                });
            });
        }
    });

    console.log(`\n🍿 Querying TMDB for ${titlesToEnrich.size} unique titles...`);
    
    const enrichmentMap = {};
    for (const title of titlesToEnrich) {
        const tmdbData = await fetchTMDBData(title);
        if (tmdbData) enrichmentMap[title] = tmdbData;
        await new Promise(r => setTimeout(r, 100)); 
    }
    
    const finalScreenings = screenings.map(s => {
        const extra = enrichmentMap[s.title];
        return {
            ...s,
            image_url: extra?.image_url || s.image_url, 
            description: extra?.description || `Screening at IFI: ${s.title}`,
        };
    });

    console.log(`✅ Found ${finalScreenings.length} screenings. Syncing...`);

    let newCount = 0;
    for (const event of finalScreenings) {
        // ROBUST DEDUPE CHECK
        const { data: existing } = await supabase
            .from('public_events')
            .select('id')
            .eq('external_id', event.external_id)
            .single();

        if (!existing) {
            const { error: insertError } = await supabase
                .from('public_events')
                .insert([event]);
            
            if (!insertError) newCount++;
        }
    }

    console.log(`🚀 Success! Added ${newCount} new IFI screenings.`);

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
        await supabase.from('scraper_logs').update({ status: 'error', error_message: err.message }).eq('id', logId);
    }
  }
}

scrapeIFI();