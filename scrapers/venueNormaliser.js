// scrapers/venueNormaliser.js

/**
 * THE BOUNCER LIST
 * Left side: The "Bad" or "Variant" name you want to catch.
 * Right side: The "Master" name you want to save.
 */
const VENUE_MAPPINGS = {
    // Variations found -> Master Name
    "Vicar St": "Vicar Street",
    "Vicar St.": "Vicar Street",
    "The 3Arena": "3Arena",
    "Three Arena": "3Arena",
    "Grand Social": "The Grand Social",
    "Academy": "The Academy",  // If TM sends just "Academy", add "The"
    "Olympia Theatre": "3Olympia Theatre",
    "NCH": "National Concert Hall",
    "Whelans": "Whelan's",
    "Whelan’s": "Whelan's", // catching the curly apostrophe
    "Civic Theatre Tallaght": "Civic Theatre",
    "Irish Film Institute (IFI)": "Irish Film Institute",
    "Irish Film Institute": "Irish Film Institute",
};

export function normaliseVenue(rawName) {
    if (!rawName) return 'TBA';

    let clean = rawName.trim();
    clean = clean.replace(/, Dublin.*$/i, ''); 
    clean = clean.replace(/, Ireland.*$/i, '');

    // CHECK DICTIONARY
    if (VENUE_MAPPINGS[clean]) {
        const masterName = VENUE_MAPPINGS[clean];
        
        // --- NEW: LOG THE CHANGE ---
        console.log(`🧹 Fixed Venue: "${clean}" ➔ "${masterName}"`);
        
        return masterName;
    }

    return clean;
}