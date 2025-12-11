import * as cheerio from 'cheerio';

async function xrayIFIPoster() {
  // URL Structure derived from the film title:
  const url = 'https://ifi.ie/film/it-was-just-an-accident/'; 
  
  console.log(`🩻 X-Raying Poster on: ${url}...`);
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // We look for any <img> tag and print its source and parent class
    console.log('\n--- ALL IMAGES IN MAIN CONTENT ---');
    $('.content img, #content img').each((i, el) => {
        const src = $(el).attr('src');
        const parent_class = $(el).closest('div[class], figure[class]').attr('class');

        if (src && !src.includes('logo') && !src.includes('icon')) {
            console.log(`SRC: ${src}`);
            console.log(`  PARENT CLASS: .${parent_class}`);
            // Stop after 5 images to avoid printing ads
            if (i > 4) return false; 
        }
    });

  } catch (err) {
    console.error(err);
  }
}

xrayIFIPoster();