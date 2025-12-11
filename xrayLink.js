import * as cheerio from 'cheerio';

async function xrayLink() {
  const url = 'https://journalofmusic.com/listing/30-10-25/piano-masterclass-michelle-cann';
  console.log(`🩻 X-Raying Links on: ${url}...`);
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('\n--- POTENTIAL OUTBOUND LINKS ---');

    // 1. Check specific Drupal fields where these links usually live
    const websiteField = $('.field-name-field-website a').attr('href');
    const bookingField = $('.field-name-field-booking-link a').attr('href');
    const ticketField = $('.field-name-field-tickets a').attr('href');

    console.log(`Field 'website': ${websiteField || '❌ Not found'}`);
    console.log(`Field 'booking': ${bookingField || '❌ Not found'}`);
    console.log(`Field 'tickets': ${ticketField || '❌ Not found'}`);

    console.log('\n--- ALL LINKS IN CONTENT ---');
    // Just in case it's unnamed, let's look at all links in the main column
    $('.content a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      // Only show external links (http/https)
      if (href && href.startsWith('http')) {
        console.log(`Link: "${text}" -> ${href}`);
        console.log(`   Parent Class: ${$(el).parent().attr('class')}`);
      }
    });

  } catch (err) {
    console.error(err);
  }
}

xrayLink();