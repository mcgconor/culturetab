import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const START_URL = 'https://dublin.ie/whats-on/'; 
const IGNORED_VENUES = ['Abbey Theatre', 'Irish Film Institute', 'Bord Gáis Energy Theatre', 'National Concert Hall'];

// --- HELPERS ---

function safeDate(val) {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

async function isDuplicate(title, dateStr, venue) {
    if (!dateStr) return false;
    
    if (IGNORED_VENUES.some(v => venue?.includes(v))) return true;

    const startDate = new Date(dateStr);
    const dayStart = startDate.toISOString().split('T')[0] + 'T00:00:00';
    const dayEnd = startDate.toISOString().split('T')[0] + 'T23:59:59';

    const { data: existing } = await supabase
        .from('public_events')
        .select('title')
        .gte('start_date', dayStart)
        .lte('start_date', dayEnd);

    if (!existing || existing.length === 0) return false;

    const cleanNew = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return existing.some(e => {
        const cleanDb = e.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanDb.includes(cleanNew) || cleanNew.includes(cleanDb);
    });
}

// --- MAIN SCRAPER ---

async function scrapeDublinIE() {
  console.log('🇮🇪 Starting Dublin.ie Sync (High Visibility)...');

  const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // 1. DISCOVER LINKS (Puppeteer)
    console.log(`   📄 Loading main page...`);
    await page.goto(START_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    try {
        await page.waitForSelector('#ccc-notify-accept', { timeout: 4000 });
        await page.click('#ccc-notify-accept');
        console.log('   🍪 Cookie banner handled.');
    } catch(e) {}

    console.log('   🖱️  Scrolling to collect links...');
    const uniqueLinks = new Set();
    
    // Scroll 5 times
    for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await new Promise(r => setTimeout(r, 1000));
        
        const currentLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(h => h.includes('/whats-on/listings/') && !h.endsWith('/listings/'));
        });
        currentLinks.forEach(l => uniqueLinks.add(l));
        process.stdout.write(`\r      Found ${uniqueLinks.size} links so far...`);
    }
    console.log(`\n   ✅ Final Count: ${uniqueLinks.size} events found.`);
    await browser.close();

    // 2. PROCESS DETAILS (Axios)
    const finalLinks = Array.from(uniqueLinks);
    console.log(`   ⚡ Starting detailed analysis...`);
    
    for (let i = 0; i < finalLinks.length; i++) {
        const url = finalLinks[i];
        
        // Progress Indicator
        process.stdout.write(`   [${i + 1}/${finalLinks.length}] Checking... `);

        try {
            // Strict 10s timeout prevents hanging
            const { data } = await axios.get(url, { 
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000 
            });
            
            const $ = cheerio.load(data);
            const title = $('h1').first().text().trim();
            
            if (!title) {
                console.log(`❌ Empty Title`);
                continue;
            }

            const image = $('meta[property="og:image"]').attr('content');
            const description = $('meta[property="og:description"]').attr('content');
            
            // Date & Venue Logic
            let venue = 'Dublin';
            let dateStr = $('meta[property="article:published_time"]').attr('content');
            
            if (!dateStr) {
                $('.event-details, .meta-data').find('p, div, span').each((i, el) => {
                    const txt = $(el).text().trim();
                    if (!dateStr && txt.match(/\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i)) {
                        dateStr = txt;
                    }
                });
            }

            const venueText = $('.event-location, .venue').text().trim();
            if (venueText) venue = venueText;

            const startDate = safeDate(dateStr);
            if (!startDate) {
                console.log(`⚠️  No Date Found`);
                continue;
            }

            // External Link
            let externalUrl = url;
            $('a').each((i, el) => {
                const h = $(el).attr('href');
                const t = $(el).text().toLowerCase();
                if (h && h.startsWith('http') && !h.includes('dublin.ie') && (t.includes('book') || t.includes('website'))) {
                    externalUrl = h;
                    return false;
                }
            });

            // Duplicate Check
            if (await isDuplicate(title, startDate, venue)) {
                console.log(`🚫 Duplicate/Ignored`);
                continue;
            }

            // Save
            const eventData = {
                title: title,
                start_date: startDate.toISOString(),
                venue: venue,
                description: description,
                image_url: image || '',
                external_url: externalUrl,
                category: 'Event',
                source: 'dublin_ie',
                scraper_source: 'syncDublinIE.js'
            };

            const { error } = await supabase
                .from('public_events')
                .upsert(eventData, { onConflict: 'external_url' });

            if (!error) console.log(`✅ Saved: "${title.substring(0, 20)}..."`);
            else console.log(`❌ DB Error`);

        } catch (e) {
            console.log(`⚠️  Network Error/Timeout`);
        }
    }

  } catch (e) {
      console.error(`\n❌ Fatal Error: ${e.message}`);
  }
}

scrapeDublinIE();