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

    const cleanNew = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return existing.some(e => {
        const cleanDb = e.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanDb.includes(cleanNew) || cleanNew.includes(cleanDb);
    });
}

// --- MAIN SCRAPER ---

async function scrapeNCH() {
  console.log('🎻 Starting National Concert Hall Sync (Aggressive Mode)...');

  const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    // Set a very tall viewport to encourage loading
    await page.setViewport({ width: 1440, height: 1200 });

    console.log(`   📄 Loading: ${START_URL}`);
    await page.goto(START_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // 1. COOKIE CRUSHER
    try {
        const cookieBtn = await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 4000 });
        if (cookieBtn) {
            await cookieBtn.click();
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch(e) {}

    // 2. AGGRESSIVE SCROLL & CLICK
    console.log('   🖱️  Loading more events (Scrolling & Clicking)...');
    
    // We try to load more content 10 times
    for (let i = 0; i < 10; i++) {
        
        // A. Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(r => setTimeout(r, 2000)); // Wait for network
        
        // B. Look for "Load More" button and click it
        // NCH selector often varies, we try a few common ones
        const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a.btn'));
            const loadMore = buttons.find(b => b.innerText.toLowerCase().includes('load more'));
            if (loadMore) {
                loadMore.click();
                return true;
            }
            return false;
        });

        if (clicked) {
            console.log(`      [${i+1}/10] Clicked "Load More"...`);
            await new Promise(r => setTimeout(r, 3000)); // Wait longer for button load
        } else {
            process.stdout.write(`      [${i+1}/10] Scrolled... \r`);
        }
    }
    console.log('\n   ✅ Finished loading.');

    // 3. EXTRACT LINKS
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
    
    // Save screenshot if still low count
    if (uniqueLinks.length < 30) {
        await page.screenshot({ path: 'debug-nch-scroll.png' });
    }
    
    await browser.close();

    console.log(`   ⚡ Processing events...`);

    // 4. PROCESS DETAILS
    for (const url of uniqueLinks) {
        try {
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(data);

            const title = $('h1').first().text().trim();
            if (!title || title.includes('All Events Listing') || title.includes('Page not found')) continue;

            const image = $('meta[property="og:image"]').attr('content');
            const description = $('meta[property="og:description"]').attr('content');

            let startDates = [];

            // A. JSON-LD Check
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const json = JSON.parse($(el).html());
                    if (json['@type'] === 'Event' || json['@type'] === 'MusicEvent') {
                        if (json.startDate) startDates.push(safeDate(json.startDate));
                        if (json.subEvent && Array.isArray(json.subEvent)) {
                            json.subEvent.forEach(sub => {
                                if (sub.startDate) startDates.push(safeDate(sub.startDate));
                            });
                        }
                    }
                } catch(e) {}
            });

            // B. Text Fallback
            if (startDates.length === 0) {
                const bodyText = $('body').text();
                const fullDateMatch = bodyText.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
                
                if (fullDateMatch) {
                    startDates.push(safeDate(fullDateMatch[0].replace(/(st|nd|rd|th)/g, '')));
                } else {
                    const shortDateMatch = bodyText.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)/i);
                    if (shortDateMatch) {
                        startDates.push(inferYear(shortDateMatch[0].replace(/(st|nd|rd|th)/g, '')));
                    }
                }
            }

            startDates = startDates
                .filter(d => d && !isNaN(d.getTime()))
                .filter((date, index, self) => self.findIndex(d => d.getTime() === date.getTime()) === index);

            if (startDates.length === 0) {
                // console.log(`      ❌ Skipped "${title.substring(0,20)}...": No date found.`);
                continue;
            }

            for (const startDate of startDates) {
                if (startDate.getHours() === 0) startDate.setHours(19, 30);

                // Check Past Date
                if (startDate < new Date()) {
                    // console.log(`      ⚠️ Skipped "${title.substring(0,15)}...": Date in past (${startDate.toLocaleDateString()})`);
                    continue;
                }

                const uniqueExternalUrl = `${url}#${startDate.toISOString()}`;

                if (await isDuplicate(title, startDate.toISOString())) {
                    // console.log(`      🚫 Duplicate: ${title}`);
                    continue;
                }

                const eventData = {
                    title: title,
                    start_date: startDate.toISOString(),
                    venue: 'National Concert Hall',
                    description: description,
                    image_url: image || '',
                    external_url: uniqueExternalUrl,
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