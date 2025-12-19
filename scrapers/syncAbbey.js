import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BASE_URL = 'https://www.abbeytheatre.ie';
const LIST_URL = 'https://www.abbeytheatre.ie/whats-on/';

// --- HELPERS ---
function safeDate(val) {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

// --- MAIN SCRAPER ---
async function scrapeAbbey() {
  console.log('🎭 Starting Abbey Theatre Sync (Cookie Crusher)...');

  const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. DEEP DISCOVERY (Find all 12+ shows)
    console.log('   🔎 Scanning for shows...');
    const eventsToProcess = [];
    const pagesToVisit = [LIST_URL];

    // Initial fetch
    const { data: indexHtml } = await axios.get(LIST_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(indexHtml);

    // Find monthly filter links (e.g. ?filter=jan-2026)
    $('a[href*="?filter="]').each((i, el) => {
        const h = $(el).attr('href');
        if (h && !h.includes('all')) pagesToVisit.push(h.startsWith('http') ? h : BASE_URL + h);
    });

    // Crawl all filter pages
    for (const p of pagesToVisit) {
        try {
            const { data } = await axios.get(p, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $$ = cheerio.load(data);
            $$('a[href*="/whats-on/"]').each((i, el) => {
                const link = $$(el).attr('href');
                if (!link.includes('filter') && !link.includes('date')) {
                     const full = link.startsWith('http') ? link : BASE_URL + link;
                     if (!eventsToProcess.some(e => e.url === full)) eventsToProcess.push({ url: full });
                }
            });
        } catch(e) {}
    }

    console.log(`   🔎 Found ${eventsToProcess.length} unique shows.`);

    // 2. PROCESS EACH SHOW
    for (const event of eventsToProcess) {
        console.log(`   ➡ Analyzing: ${event.url}`);

        // A. Metadata (Title, Image)
        let title = '', image = '', desc = '', bookingUrl = null;
        let jsonStart = null;

        try {
            const { data: html } = await axios.get(event.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $$ = cheerio.load(html);
            title = $$('h1').first().text().replace(' - Abbey Theatre', '').trim();
            image = $$('meta[property="og:image"]').attr('content');
            desc = $$('meta[property="og:description"]').attr('content');

            $$('a').each((i, el) => {
                const h = $$(el).attr('href');
                if (h && h.includes('booking.abbeytheatre.ie/events/')) {
                    bookingUrl = h.split('?')[0] + '?hidedate'; // Force list view
                }
            });

            // JSON-LD Backup (for Grianstad)
            $$('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const json = JSON.parse($$(el).html());
                    if (json.startDate) jsonStart = safeDate(json.startDate);
                } catch(e) {}
            });

        } catch (e) { console.log(`      ⚠️ Meta Error: ${e.message}`); continue; }

        let finalDates = [];
        let method = '';

        // B. SCRAPE BOOKING PAGE (With Cookie Clicker)
        if (bookingUrl) {
            console.log(`      🎟️  Reading: ${bookingUrl}`);
            const page = await browser.newPage();
            // Force Desktop to ensure list renders
            await page.setViewport({ width: 1920, height: 1080 });

            try {
                await page.goto(bookingUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

                // --- 🍪 COOKIE CRUSHER 🍪 ---
                // Wait for a second to let the modal appear
                await new Promise(r => setTimeout(r, 2000));
                
                // Try to find and click "Accept" or "Agreed" buttons
                const clicked = await page.evaluate(() => {
                    // Look for buttons with text "Accept", "Agree", "Allow"
                    const buttons = Array.from(document.querySelectorAll('button, a.btn'));
                    const acceptBtn = buttons.find(b => 
                        b.innerText.match(/Accept|Agree|Allow/i) && 
                        b.offsetParent !== null // Must be visible
                    );
                    if (acceptBtn) {
                        acceptBtn.click();
                        return true;
                    }
                    return false;
                });

                if (clicked) {
                    // console.log(`      🍪 Cookie Banner Clicked. Waiting for refresh...`);
                    await new Promise(r => setTimeout(r, 2000)); // Wait for modal to vanish
                }

                // Wait for typical date text (e.g., "2025")
                try {
                    await page.waitForFunction(
                        () => document.body.innerText.includes('2025') || document.body.innerText.includes('2026'),
                        { timeout: 8000 }
                    );
                } catch(e) {}

                // Extract Text
                const pageText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
                
                // Regex: "Thursday 18 Dec 2025 , 7:00PM"
                const regex = /[A-Za-z,.]+\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4}).*?(\d{1,2}:\d{2}\s*[AP]M)/gi;
                let match;
                while ((match = regex.exec(pageText)) !== null) {
                    const dateStr = `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
                    const d = safeDate(dateStr);
                    if (d) finalDates.push(d);
                }

                if (finalDates.length > 0) method = 'Booking Page';

            } catch (e) {
                console.log(`      ⚠️ Puppeteer Error: ${e.message}`);
            } finally {
                await page.close();
            }
        }

        // C. FALLBACK TO JSON (If Booking Page failed or didn't exist)
        if (finalDates.length === 0 && jsonStart) {
            // Only use if we trust it (single date)
            if (jsonStart.getHours() === 0) jsonStart.setHours(19, 30);
            finalDates.push(jsonStart);
            method = 'JSON Single Date';
        }

        if (finalDates.length === 0) {
             console.log(`      ❌ Skipped (No Dates Found)`);
             continue;
        }

        // D. VALIDATE & SAVE
        // Deduplicate
        const uniqueDates = finalDates
            .filter(d => !isNaN(d.getTime()))
            .filter((d, i, self) => i === self.findIndex((t) => t.getTime() === d.getTime()));

        const generatedEvents = uniqueDates.map(date => {
            const uniqueSlug = `#date=${date.toISOString().replace(/[:.]/g,'-')}`;
            return {
                title: title,
                start_date: date.toISOString(),
                venue: 'Abbey Theatre',
                description: desc,
                image_url: image,
                external_url: event.url + uniqueSlug,
                category: 'Theatre',
                source: 'abbey_theatre',
                scraper_source: 'syncAbbey.js'
            };
        });

        const uniqueEvents = Array.from(new Map(generatedEvents.map(item => [item.external_url, item])).values());
        
        const { error } = await supabase.from('public_events').upsert(uniqueEvents, { onConflict: 'external_url' });

        if (error) console.error(`      ❌ DB Error:`, error.message);
        else console.log(`      ✅ Saved ${uniqueEvents.length} performances via [${method}].`);
    }

  } catch (error) {
    console.error('Fatal Error:', error);
  } finally {
    if (browser) await browser.close();
  }
}

scrapeAbbey();