import * as cheerio from 'cheerio';

async function xrayIFISchema() {
  const url = 'https://ifi.ie/film/it-was-just-an-accident/'; 
  
  console.log(`🩻 X-Raying entire page for hidden JSON/Image URLs...`);
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('\n--- SCRIPT TAGS CONTAINING "image" or "poster" ---');
    // Search all script tags for text that looks like a URL/image reference
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && (scriptContent.includes('"image"') || scriptContent.includes('poster'))) {
            // Print a snippet of the content
            console.log(`\n-- Script Tag ${i} --`);
            // Print the content between start and end of the image reference
            console.log(scriptContent.substring(scriptContent.indexOf('image'), scriptContent.indexOf('image') + 200) + '...'); 
            console.log('------------------');
        }
    });

  } catch (err) {
    console.error(err);
  }
}

xrayIFISchema();