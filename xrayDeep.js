import * as cheerio from 'cheerio';

async function xrayDeep() {
  // A specific event URL we know exists (from your earlier log)
  const url = 'https://journalofmusic.com/listing/30-10-25/piano-masterclass-michelle-cann';
  
  console.log(`🩻 X-Raying Detail Page: ${url}...`);
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('\n--- IMAGE SECTION HTML ---');
    // Dump the main image container to see what's inside
    console.log($('.field-name-field-image').html());
    
    // Also check for any generic image tags in the main content just in case
    console.log('\n--- ALL IMAGES ON PAGE ---');
    $('img').each((i, el) => {
      console.log(`Image ${i}: src="${$(el).attr('src')}"`);
    });

  } catch (err) {
    console.error(err);
  }
}

xrayDeep();