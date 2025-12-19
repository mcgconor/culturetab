import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY;
const SCHEDULE_URL = 'https://ifi.ie/weekly-schedule/';

const client = axios.create({
    timeout: 15000,
    httpsAgent: new https.Agent({ keepAlive: true }),
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
});

// --- HELPERS ---

function cleanTitle(rawTitle) {
    let title = rawTitle;

    // 1. Remove leading junk (e.g., "50 ", "00 ", "15.40 ")
    // Matches digits followed by space/dot/dash at start
    title = title.replace(/^[\d\s.:-]+/, '');

    // 2. Remove Technical/Accessibility Tags (e.g., (35mm), (OC), (Digital))
    title = title.replace(/\s*\((?:Digital|35mm|70mm|4k|OC|AD|ISL|CC|Open Captioned)\)/gi, '');

    // 3. Remove IFI Brand Prefixes
    // "Wild Strawberries: Batman" -> "Batman"
    // "Preview: Saipan" -> "Saipan"
    title = title.replace(/^(Preview|Irish Focus|Wild Strawberries|Mystery Matinee|Archive at Lunchtime):\s*/i, '');

    // 4. Remove "+ Q&A" suffixes
    title = title.replace(/\s*\+\s*Q&A.*/i, '');

    return title.trim();
}

async function fetchTMDBData(title) {
    if (!TMDB_API_KEY || !title) return null;
    try {
        // Search
        const searchRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: { api_key: TMDB_API_KEY, query: title }
        });
        const movie = searchRes.data.results?.[0];
        
        if (!movie) return null;

        // Details
        const creditsRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/credits`, {
            params: { api_key: TMDB_API_KEY }
        });
        const director = creditsRes.data.crew?.find(p => p.job === 'Director')?.name;

        return {
            image_url: movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : null,
            description: movie.overview,
            director: director,
            tmdb_rating: movie.vote_average
        };
    } catch (e) {
        return null;
    }
}

// --- MAIN SCRAPER ---

async function scrapeIFI() {
  console.log('🎬 Starting IFI Sync (Smart Cleaner)...');

  try {
    const { data } = await client.get(SCHEDULE_URL);
    const $ = cheerio.load(data);
    
    $('script, style, nav, footer, header').remove();
    const rawText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Split by Day
    const daySplitRegex = /(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s+([A-Z]+)\s+(\d{1,2}(?:ST|ND|RD|TH)?)/gi;
    let chunks = [];
    let match;
    while ((match = daySplitRegex.exec(rawText)) !== null) {
        chunks.push({ header: match[0], index: match.index, dateStr: match[0] });
    }

    console.log(`   📅 Found ${chunks.length} day headers.`);
    let rawScreenings = [];

    // Process Chunks
    for (let i = 0; i < chunks.length; i++) {
        const currentChunk = chunks[i];
        const startText = currentChunk.index + currentChunk.header.length;
        const endText = (i + 1 < chunks.length) ? chunks[i+1].index : rawText.length;
        const dayContent = rawText.substring(startText, endText);

        // Parse Date
        const cleanDate = currentChunk.dateStr.replace(/(st|nd|rd|th)/gi, '').trim(); 
        const dateParts = cleanDate.split(' '); 
        if (dateParts.length < 3) continue;

        const year = new Date().getFullYear();
        let dateObj = new Date(`${dateParts[1]} ${dateParts[2]} ${year}`);
        if (dateObj < new Date() && dateObj.getMonth() < 3) dateObj.setFullYear(year + 1);

        // Find Movies
        const timeRegex = /[-–]\s*(\d{1,2})[.:](\d{2})/g;
        let timeMatch;
        let lastMatchIndex = 0;

        while ((timeMatch = timeRegex.exec(dayContent)) !== null) {
            // Extract raw title text
            const textBefore = dayContent.substring(lastMatchIndex, timeMatch.index).trim();
            // Split by common delimiters to separate from previous entry
            const segments = textBefore.split(/[.●]/); 
            let rawTitle = segments[segments.length - 1].trim(); 
            
            // CLEAN TITLE HERE
            let title = cleanTitle(rawTitle);

            if (title.length > 2 && !title.match(/Schedule|IFI|Open/i)) {
                const h = parseInt(timeMatch[1]);
                const m = parseInt(timeMatch[2]);
                const start = new Date(dateObj);
                start.setHours(h, m, 0);

                rawScreenings.push({
                    title: title, // Clean title for TMDB
                    original_title: rawTitle, // Keep raw just in case
                    start_date: start,
                    original_id: `#ifi-${start.getTime()}-${title.substring(0,5).replace(/\s/g,'')}`
                });
            }
            lastMatchIndex = timeMatch.index + timeMatch[0].length;
        }
    }

    // Enrich with TMDB
    console.log(`   🍿 Found ${rawScreenings.length} screenings. Fetching metadata...`);
    const uniqueTitles = [...new Set(rawScreenings.map(s => s.title))];
    const movieCache = {};

    for (const title of uniqueTitles) {
        if (title.includes("Programme") || title.includes("Shorts")) continue;
        const metadata = await fetchTMDBData(title);
        if (metadata) {
            movieCache[title] = metadata;
            console.log(`      ✨ Enriched: "${title}"`);
        } else {
            console.log(`      ⚠️ No TMDB match: "${title}"`);
        }
    }

    // Merge & Save
    const finalEvents = rawScreenings.map(s => {
        const meta = movieCache[s.title] || {};
        
        return {
            title: s.title, // Use cleaned title
            start_date: s.start_date.toISOString(),
            venue: 'Irish Film Institute',
            // Format description nicely
            description: meta.director ? `Director: ${meta.director}\n\n${meta.description || ''}` : (meta.description || 'Check IFI website for details.'),
            image_url: meta.image_url || '',
            external_url: 'https://ifi.ie/weekly-schedule' + s.original_id,
            category: 'Film',
            source: 'ifi',
            scraper_source: 'syncIFI.js'
        };
    });

    if (finalEvents.length > 0) {
        const uniqueEvents = Array.from(new Map(finalEvents.map(item => [item.external_url, item])).values());
        const { error } = await supabase.from('public_events').upsert(uniqueEvents, { onConflict: 'external_url' });
        
        if (error) console.error(`❌ DB Error: ${error.message}`);
        else console.log(`✅ Synced ${uniqueEvents.length} IFI screenings.`);
    }

  } catch (e) {
      console.error(`❌ Error: ${e.message}`);
  }
}

scrapeIFI();