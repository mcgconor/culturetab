import * as cheerio from 'cheerio';

async function debug() {
  console.log('🕵️‍♀️  Inspecting Journal of Music...');
  
  try {
    const response = await fetch('https://journalofmusic.com/listings/events');
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('--- RAW FINDINGS ---');

    $('.view-content .views-row').each((i, el) => {
      // Grab elements
      const title = $(el).find('.views-field-title a').text().trim();
      
      // I suspect this class selector might be the issue:
      const venue = $(el).find('.views-field-field-venue-name').text().trim(); 
      const location = $(el).find('.views-field-field-event-location').text().trim(); // Let's check if there is a separate location field

      if (title) {
        console.log(`\nEVENT ${i + 1}:`);
        console.log(`Title:    "${title}"`);
        console.log(`Venue:    "${venue}"`); 
        console.log(`Location: "${location}"`); // Check if this exists
      }
    });

  } catch (err) {
    console.error(err);
  }
}

debug();