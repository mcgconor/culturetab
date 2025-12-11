import React from 'react';

const SCRAPER_DOCS = [
    {
        name: "Ticketmaster_Bot_v1",
        file: "scrapers/syncTicketmaster.js",
        description: "Fetches the top 100 upcoming events in Dublin from the Ticketmaster Discovery API.",
        fetch: {
            url: "app.ticketmaster.com/discovery/v2/events",
            method: "JSON API",
            filters: [
                { label: "Geography", value: "City = Dublin" },
                { label: "Quantity", value: "Top 100 events sorted by Date (Ascending)" },
                { label: "Categories", value: "Music, Arts, Theatre (Implicit via API)" },
            ],
            time: "Next ~3-12 months"
        },
        enrichment: "None. Uses raw data from Ticketmaster.",
        output: "Maps 'Music' → 'concert', 'Arts/Theatre' → 'theatre'. Auto-generates ID."
    },
    {
        name: "IFI_Bot_v1",
        file: "scrapers/syncIFI.js",
        description: "Scrapes the IFI Weekly Schedule page for film times and dates.",
        fetch: {
            url: "ifi.ie/weekly-schedule",
            method: "Cheerio (HTML Scrape)",
            filters: [
                { label: "Parser", value: "Scans for 'DAY [MONTH]' headers" },
                { label: "Target", value: "Film screenings only" },
            ],
            time: "Current Weekly Schedule (7-14 days)"
        },
        enrichment: "Premium: Queries TMDB API using film title to fetch high-res posters (.jpg) and official overview text.",
        output: "Category: 'film'. Uses 'Title + Date' to detect duplicates."
    },
    {
        name: "Journal_of_Music_Bot_v1",
        file: "scrapers/syncJournal.js",
        description: "Scrapes The Journal of Music listings, filtering specifically for Dublin venues.",
        fetch: {
            url: "journalofmusic.com/listings/events",
            method: "Cheerio (HTML Scrape)",
            filters: [
                { label: "Pagination", value: "Scans Pages 1-3" },
                { label: "Venue Filter", value: "Matches text against a hardcoded list of Dublin venues" },
            ],
            time: "Most recent listings"
        },
        enrichment: "Smart Link Finder: Scans detail page for buttons labelled 'Tickets', 'Booking', or 'Website' to find the direct purchase link.",
        output: "Category: 'concert'. Source: 'Journal_of_Music_Bot_v1'."
    }
];

export default function ScraperDocs() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Intro */}
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Scraper Registry</h3>
                <p className="text-sm text-blue-700">
                    This documentation reflects the logic currently running in your GitHub Actions workflow (`daily-sync.yml`).
                    These scripts run automatically at 4:00 AM UTC daily.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {SCRAPER_DOCS.map((doc, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        {/* Card Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h4 className="text-lg font-black text-gray-900">{doc.name}</h4>
                                <code className="text-xs font-mono text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{doc.file}</code>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full">
                                Active
                            </span>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Left Column: Fetching Logic */}
                            <div>
                                <h5 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Acquisition Logic</h5>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-2">
                                        <span className="min-w-[60px] font-semibold text-gray-700">Source:</span>
                                        <span className="text-blue-600 font-mono text-xs mt-0.5">{doc.fetch.url}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="min-w-[60px] font-semibold text-gray-700">Method:</span>
                                        <span className="text-gray-600">{doc.fetch.method}</span>
                                    </div>
                                    <div>
                                        <span className="block font-semibold text-gray-700 mb-1">Filters:</span>
                                        <ul className="list-disc list-inside text-gray-500 pl-1 space-y-1">
                                            {doc.fetch.filters.map((f, i) => (
                                                <li key={i}>
                                                    <span className="font-medium text-gray-700">{f.label}:</span> {f.value}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Enrichment & Output */}
                            <div>
                                <h5 className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Processing & Enrichment</h5>
                                <div className="space-y-4 text-sm">
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                        <span className="block font-bold text-amber-800 text-xs uppercase mb-1">Enrichment</span>
                                        <p className="text-amber-900 leading-relaxed">{doc.enrichment}</p>
                                    </div>
                                    
                                    <div>
                                        <span className="font-semibold text-gray-700 block mb-1">Database Output:</span>
                                        <p className="text-gray-500">{doc.output}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}