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
    timeout: 20000,
    httpsAgent: new https.Agent({ keepAlive: true }),
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
});

// --- HELPER 1: Title Cleaner ---
function cleanTitle(rawTitle) {
    if (!rawTitle) return '';
    let title = rawTitle;

    // 1. Remove leading times (e.g. "18.30 ", "15:45 ")
    title = title.replace(/^[\d]{1,2}[:.][\d]{2}\s+/, '');

    // 2. Remove Tech Specs / Accessibility (Case insensitive)
    title = title.replace(/\s*\((?:Digital|35mm|70mm|4k|OC|AD|ISL|CC|Open Captioned|Subtitled)\)/gi, '');

    // 3. Remove IFI Brand Prefixes
    title = title.replace(/^(Preview|Irish Focus|Wild Strawberries|Mystery Matinee|Archive at Lunchtime|IFI Family|Feast Your Eyes|IFI French Film Festival):\s*/i, '');

    // 4. Remove Q&A suffixes
    title = title.replace(/\s*\+\s*(Q&A|Introduction).*/i, '');

    // 5. Remove junk characters at start AND END
    // Fixes the "Batman -" issue
    title = title.replace(/^[-–.]+\s*/, ''); 
    title = title.replace(/\s*[-–.]+$/, ''); 

    return title.trim();
}

// --- HELPER 2: TMDB Fetcher ---
async function fetchTMDBData(title) {
    if (!TMDB_API_KEY || !title) return null;
    if (title.includes('Shorts') || title.includes('Programme')) return null; 

    try {
        // Search
        const searchRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: { api_key: TMDB_API_KEY, query: title }
        });
        
        const movie = searchRes.data.results?.[0];
        if (!movie) return null;

        // Get Director
        const creditsRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/credits`, {
            params: { api_key: TMDB_API_KEY }
        });
        const director = creditsRes.data.crew?.find(p => p.job === 'Director')?.name;

        return {
            image_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
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
  console.log('🎬 Starting IFI Sync (Clean Titles + TMDB)...');

  try {
    const { data } = await client.get(SCHEDULE_URL);
    const $ = cheerio.load(data);
    
    $('script, style, nav, footer, header').remove();
    const rawText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Regex for Day Headers
    const daySplitRegex = /(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s+([A-Z]+)\s+(\d{1,2}(?:ST|ND|RD|TH)?)/gi;
    
    let chunks = [];
    let match;
    while ((match = daySplitRegex.exec(rawText)) !== null) {
        chunks.push({ header: match[0], index: match.index, dateStr: match[0] });
    }

    console.log(`   📅 Found ${chunks.length} day headers.`);
    let rawScreenings = [];

    for (let i = 0; i < chunks.length; i++) {
        const currentChunk = chunks[i];
        const startText = currentChunk.index + currentChunk.header.length;
        const endText = (i + 1 < chunks.length) ? chunks[i+1].index : rawText.length;
        const dayContent = rawText.substring(startText, endText);

        // Date Parsing
        const cleanDateStr = currentChunk.dateStr.replace(/(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)/gi, '').replace(/(ST|ND|RD|TH)/gi, '').trim(); 
        const year = new Date().getFullYear();
        let dateObj = new Date(`${cleanDateStr} ${year}`);
        
        // Handle Year Crossover
        if (dateObj < new Date() && dateObj.getMonth() < 3 && new Date().getMonth() > 9) {
            dateObj.setFullYear(year + 1);
        }

        // Parse Times & Titles
        const timeRegex = /[-–\s](\d{1,2})[.:](\d{2})/g;
        const matches = [...dayContent.matchAll(timeRegex)];
        
        for (let m = 0; m < matches.length; m++) {
            const currentMatch = matches[m];
            const nextMatch = matches[m+1];
            
            const startIdx = currentMatch.index + currentMatch[0].length;
            const endIdx = nextMatch ? nextMatch.index : dayContent.length;
            
            const rawTitle = dayContent.substring(startIdx, endIdx).trim();
            const clean = cleanTitle(rawTitle);

            if (clean.length > 2 && !clean.match(/Schedule|IFI|Open|Closed/i)) {
                const h = parseInt(currentMatch[1]);
                const min = parseInt(currentMatch[2]);
                const start = new Date(dateObj);
                start.setHours(h, min, 0);

                rawScreenings.push({
                    title: clean,
                    start_date: start,
                    original_id: `#ifi-${start.getTime()}-${clean.substring(0,5).replace(/\s/g,'')}`
                });
            }
        }
    }

    console.log(`   🍿 Found ${rawScreenings.length} screenings. Fetching TMDB data...`);
    const uniqueTitles = [...new Set(rawScreenings.map(s => s.title))];
    const movieCache = {};

    for (const title of uniqueTitles) {
        const metadata = await fetchTMDBData(title);
        if (metadata) {
            movieCache[title] = metadata;
            console.log(`      ✨ Enriched: "${title}"`);
        } else {
            console.log(`      ⚠️ No TMDB match: "${title}"`);
        }
    }

    const finalEvents = rawScreenings.map(s => {
        const meta = movieCache[s.title] || {};
        
        let desc = 'Screening at IFI.';
        if (meta.director) desc = `Director: ${meta.director}\n\n${meta.description}`;
        else if (meta.description) desc = meta.description;

        return {
            title: s.title,
            start_date: s.start_date.toISOString(),
            venue: 'Irish Film Institute',
            description: desc,
            image_url: meta.image_url || '',
            external_url: 'https://ifi.ie/weekly-schedule' + s.original_id,
            category: 'Film',
            source: 'ifi',
            scraper_source: 'syncIFI.js'
        };
    });

    if (finalEvents.length > 0) {
        const uniqueEvents = Array.from(new Map(finalEvents.map(item => [item.external_url, item])).values());
        
        const { error } = await supabase
            .from('public_events')
            .upsert(uniqueEvents, { onConflict: 'external_url' });
        
        if (error) console.error(`❌ DB Error: ${error.message}`);
        else console.log(`✅ Synced ${uniqueEvents.length} IFI screenings.`);
    } else {
        console.log(`⚠️ No screenings found.`);
    }

  } catch (e) {
      console.error(`❌ Fatal Error: ${e.message}`);
  }
}

scrapeIFI();