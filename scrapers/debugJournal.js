import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

const TARGET_URL = 'https://journalofmusic.com/listing/24-09-25/ursula-ui-chuinneagain-bursary-young-pianists-2025';

async function debugPage() {
    console.log(`🕵️‍♀️ Inspecting: ${TARGET_URL}`);
    
    // 1. Fetch with "Real Browser" Headers
    const res = await fetch(TARGET_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html'
        }
    });
    
    console.log(`HTTP Status: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    console.log('\n--- 1. META IMAGES (OG:IMAGE) ---');
    $('meta[property="og:image"]').each((i, el) => console.log(`   [${i}] ${$(el).attr('content')}`));

    console.log('\n--- 2. ALL IMAGES FOUND ---');
    $('img').each((i, el) => {
        const src = $(el).attr('src');
        const dataSrc = $(el).attr('data-src');
        const classes = $(el).attr('class');
        // Filter out tiny icons to reduce noise
        if (src && !src.includes('icon') && !src.includes('logo')) {
            console.log(`   [${i}] SRC: ${src}`);
            if (dataSrc) console.log(`       DATA-SRC: ${dataSrc}`);
            if (classes) console.log(`       CLASS: ${classes}`);
        }
    });

    console.log('\n--- 3. ALL LINKS WITH "WEBSITE/BOOK/TICKET" ---');
    $('a').each((i, el) => {
        const text = $(el).text().trim().toLowerCase();
        const href = $(el).attr('href');
        if (text.includes('web') || text.includes('book') || text.includes('ticket') || text.includes('info')) {
            console.log(`   [${i}] TEXT: "${text}" -> HREF: ${href}`);
        }
    });

    console.log('\n--- 4. DRUPAL SPECIFIC FIELDS ---');
    console.log('   .field-name-field-image img:', $('.field-name-field-image img').attr('src'));
    console.log('   .field-name-field-website a:', $('.field-name-field-website a').attr('href'));
    console.log('   .field-name-field-booking-url a:', $('.field-name-field-booking-url a').attr('href'));
}

debugPage();