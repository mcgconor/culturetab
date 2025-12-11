import * as cheerio from 'cheerio';

async function xrayIFI() {
  const url = 'https://ifi.ie/weekly-schedule';
  console.log(`🩻 X-Raying IFI Schedule Containers...`);
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for the date header text we know exists: "MONDAY DECEMBER"
    // We filter elements to only look at those whose text starts with "MONDAY" 
    const targetElement = $('*:contains("MONDAY DECEMBER")').filter((i, el) => {
        return $(el).text().trim().startsWith('MONDAY');
    }).first();

    if (targetElement.length === 0) {
        console.log('❌ Could not find the date header element.');
        return;
    }

    console.log('\n--- TARGET ELEMENT (The Date Header) ---');
    console.log(`Tag: ${targetElement.get(0).tagName}`);
    console.log(`Text: ${targetElement.text().trim()}`);

    // Find the nearest class wrapper that contains the whole schedule list
    // We go up the DOM tree until we find a parent with a class name.
    const wrapper = targetElement.closest('div[class], ul[class], ol[class]').get(0);

    if (wrapper) {
        console.log('\n--- WRAPPER ELEMENT (The Looping Selector) ---');
        console.log(`Wrapper Tag: ${wrapper.tagName}`);
        console.log(`Wrapper Class: .${$(wrapper).attr('class').split(' ').join('.')}`); // Output safe class name
    } else {
        console.log('❌ Could not find a class wrapper for the schedule.');
    }

  } catch (err) {
    console.error(err);
  }
}

xrayIFI();