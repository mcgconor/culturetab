import * as cheerio from 'cheerio';

async function xray() {
  console.log('🩻 X-Raying the first event card...');
  
  try {
    const response = await fetch('https://journalofmusic.com/listings/events');
    const html = await response.text();
    const $ = cheerio.load(html);

    // Grab the very first event card
    const firstCard = $('.view-content .views-row').first();

    if (firstCard.length === 0) {
      console.log('❌ Could not find any card with .views-row');
      return;
    }

    // Print the raw HTML of that card so we can read the class names
    console.log('--- CARD HTML START ---');
    console.log(firstCard.html());
    console.log('--- CARD HTML END ---');

  } catch (err) {
    console.error(err);
  }
}

xray();