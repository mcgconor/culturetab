import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const START_URL = 'https://www.nch.ie/all-events-listing/'; 

// --- HELPERS ---

function safeDate(val) {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

function inferYear(dateString) {
    const now = new Date();
    const currentYear = now.getFullYear();
    let d = new Date(`${dateString} ${currentYear}`);
    // If date has passed (e.g. looking at Jan while in Dec), it's next year
    if (d < now && d.getMonth() < now.getMonth()) {
        d = new Date(`${dateString} ${currentYear + 1}`);
    }
    return d;
}

async function isDuplicate(title, dateStr) {
    if (!dateStr) return false;
    const startDate = new Date(dateStr);
    const dayStart = startDate.toISOString().split('T')[0] + 'T00:00:00';
    const dayEnd = startDate.toISOString().split('T')[0] + 'T23:59:59';

    const { data: existing } = await supabase
        .from('public_events')
        .select('title')
        .eq('venue', 'National Concert Hall')
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

// --- MAIN SCRAPER ---

async function scrapeNCH() {
  console.log('🎻 Starting National Concert Hall Sync (Recurring + Deep Scroll)...');

  const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log(`   📄 Loading: ${START_URL}`);
    await page.goto(START_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Cookie Banner
    try {
        const cookieBtn = await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 4000 });
        if (cookieBtn) await cookieBtn.click();
    } catch(e) {}

    // --- IMPROVED SCROLLING ---
    console.log('   🖱️  Deep Scrolling (Fetching > 1 month data)...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 150;
            const maxScrolls = 400; // Increased to scroll further down
            let scrolls = 0;
            
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrolls++;
                
                // Stop if we hit bottom OR scrolled enough (approx 60,000px)
                if(totalHeight >= scrollHeight || scrolls > maxScrolls){
                    clearInterval(timer);
                    resolve();
                }
            }, 50); // Faster scroll
        });
    });

    // Extract Links
    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
            .map(a => a.href)
            .filter(href => 
                href.includes('/all-events-listing/') && 
                href !== window.location.href && 
                !href.endsWith('/all-events-listing/')
            );
    });

    const uniqueLinks = [...new Set(links)];
    console.log(`   🔎 Found ${uniqueLinks.length} event links.`);
    await browser.close();

    console.log(`   ⚡ Processing events (Checking for recurring dates)...`);

    for (const url of uniqueLinks) {
        try {
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(data);

            const title = $('h1').first().text().trim();
            if (!title || title.includes('All Events Listing') || title.includes('Page not found')) continue;

            const image = $('meta[property="og:image"]').attr('content');
            const description = $('meta[property="og:description"]').attr('content');

            // --- DATE STRATEGY (Handling Multiple Dates) ---
            let startDates = [];

            // 1. JSON-LD Check (Best for Recurring)
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const json = JSON.parse($(el).html());
                    
                    // Case A: Single Event
                    if (json['@type'] === 'Event' || json['@type'] === 'MusicEvent') {
                        if (json.startDate) startDates.push(safeDate(json.startDate));
                        
                        // Case B: Recurring (subEvents)
                        if (json.subEvent && Array.isArray(json.subEvent)) {
                            json.subEvent.forEach(sub => {
                                if (sub.startDate) startDates.push(safeDate(sub.startDate));
                            });
                        }
                    }
                } catch(e) {}
            });

            // 2. Text Scraper (Fallback if JSON-LD failed)
            if (startDates.length === 0) {
                const bodyText = $('body').text();
                // Matches "24 Oct 2025"
                const fullDateMatch = bodyText.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
                
                if (fullDateMatch) {
                    startDates.push(safeDate(fullDateMatch[0].replace(/(st|nd|rd|th)/g, '')));
                } else {
                    // Try Short Date + Inference
                    const shortDateMatch = bodyText.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)/i);
                    if (shortDateMatch) {
                        const raw = shortDateMatch[0].replace(/(st|nd|rd|th)/g, '');
                        startDates.push(inferYear(raw));
                    }
                }
            }

            // Remove invalid dates and duplicates
            startDates = startDates
                .filter(d => d && !isNaN(d.getTime()))
                .filter((date, index, self) => self.findIndex(d => d.getTime() === date.getTime()) === index); // Unique

            if (startDates.length === 0) {
                console.log(`      ❌ Skipped "${title.substring(0,20)}...": No date found.`);
                continue;
            }

            // --- SAVE LOOP (One Entry Per Date) ---
            for (const startDate of startDates) {
                
                // Default Time Fix
                if (startDate.getHours() === 0) startDate.setHours(19, 30);

                // Skip if date is in the past (clean database)
                if (startDate < new Date()) continue;

                // Create Unique URL for DB (Append Date Hash)
                // e.g. https://nch.ie/event/concert#2025-05-20
                const uniqueExternalUrl = `${url}#${startDate.toISOString()}`;

                // DUPLICATE CHECK
                if (await isDuplicate(title, startDate.toISOString())) {
                    // console.log(`      🚫 Duplicate (Skipping): ${title} on ${startDate.toLocaleDateString()}`);
                    continue;
                }

                const eventData = {
                    title: title,
                    start_date: startDate.toISOString(),
                    venue: 'National Concert Hall',
                    description: description,
                    image_url: image || '',
                    external_url: uniqueExternalUrl, // Uses the unique hashed URL
                    category: 'Music',
                    source: 'nch',
                    scraper_source: 'syncNCH.js'
                };

                const { error } = await supabase
                    .from('public_events')
                    .upsert(eventData, { onConflict: 'external_url' });

                if (!error) console.log(`      ✅ Saved: ${title.substring(0, 30)}... on ${startDate.toLocaleDateString('en-IE')}`);
            }

        } catch (e) {
            // console.log(`      ⚠️ Error: ${e.message}`);
        }
    }

  } catch (e) {
    console.error(`❌ Fatal Error: ${e.message}`);
  }
}

scrapeNCH();