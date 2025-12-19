import axios from 'axios';

// We test with the ID for "Backstage Tours" (18275) since we know it has dates.
const ID = '18275'; 
const BASE = 'https://booking.abbeytheatre.ie/api';

const endpoints = [
    `${BASE}/products/${ID}`,
    `${BASE}/products/${ID}/performances`,
    `${BASE}/production-seasons/${ID}/performances`,
    `${BASE}/events`, 
    `${BASE}/events/${ID}`
];

async function probe() {
    console.log(`🕵️‍♀️ Probing Abbey API for ID: ${ID}...\n`);

    for (const url of endpoints) {
        try {
            console.log(`Testing: ${url}`);
            const { data } = await axios.get(url, { 
                headers: { 'User-Agent': 'Mozilla/5.0' },
                validateStatus: () => true // Don't throw on 404
            });

            // Check if we got a list of dates
            if (Array.isArray(data) && data.length > 0) {
                console.log(`   🎉 JACKPOT! Found array with ${data.length} items.`);
                console.log(`   Sample:`, JSON.stringify(data[0]).substring(0, 100));
                return; // Stop after finding the winner
            } else if (data && data.id) {
                console.log(`   ⚠️  Found Object (Single Item), but looking for a list...`);
            } else {
                console.log(`   ❌ Failed (Status or Format invalid)`);
            }
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
        }
    }
}

probe();