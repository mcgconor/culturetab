import * as cheerio from 'cheerio';

async function xraySearch() {
  const url = 'https://journalofmusic.com/listing/30-10-25/piano-masterclass-michelle-cann';
  console.log(`🕵️‍♀️ Searching everywhere on: ${url}...`);
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Find any link that contains the text "Website"
    console.log('\n--- SEARCHING FOR TEXT "WEBSITE" ---');
    $('a').each((i, el) => {
      const text = $(el).text().trim();
      if (text.toLowerCase().includes('website')) {
        console.log(`FOUND: "${text}"`);
        console.log(`   Link: ${$(el).attr('href')}`);
        console.log(`   Parent Class: ${$(el).parent().attr('class')}`);
        console.log(`   Grandparent Class: ${$(el).parent().parent().attr('class')}`);
      }
    });

    // 2. Find any link that goes to NCH.ie
    console.log('\n--- SEARCHING FOR LINK "nch.ie" ---');
    $('a[href*="nch.ie"]').each((i, el) => {
      console.log(`FOUND LINK: ${$(el).attr('href')}`);
      console.log(`   Text: "${$(el).text().trim()}"`);
      console.log(`   Container Class: ${$(el).closest('div').attr('class')}`);
    });

  } catch (err) {
    console.error(err);
  }
}

xraySearch();