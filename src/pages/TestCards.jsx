import React from 'react';
import UniversalCard from '../components/UniversalCard';

export default function TestCards() {
  
  // --- MOCK DATA: PUBLIC EVENTS ---
  const publicEvents = [
    {
      id: 'pub-1',
      title: 'The National',
      start_date: '2025-06-25T19:00:00',
      venue: '3Arena',
      category: 'concert',
      image_url: 'https://s1.ticketm.net/dam/a/c40/e0f509t9-5483-470b-a737-02302302c40_123456_RETINA_PORTRAIT_16_9.jpg',
      external_url: 'https://ticketmaster.ie'
    },
    {
      id: 'pub-2',
      title: 'Nosferatu (1922) with Live Score',
      start_date: '2025-10-31T20:30:00',
      venue: 'Irish Film Institute',
      category: 'film',
      image_url: null, 
      external_url: 'https://ifi.ie'
    }
  ];

  // --- MOCK DATA: USER ENTRIES ---
  const userEntries = [
    // 1. CONVERTED CONCERT (Should say "Performed at 3Arena")
    {
      id: 'conv-1',
      title: 'The National: 2024 Tour', 
      creator: 'The National', 
      venue: '3Arena', // <--- ADDED VENUE HERE
      kind: 'concert',
      event_date: '2024-09-01',
      rating: 5, 
      image_url: 'https://s1.ticketm.net/dam/a/c40/e0f51627-7734-4b9b-9040-d703d1685c40_1832961_TABLET_LANDSCAPE_LARGE_16_9.jpg'
    },
    // 2. FILM (Should say "Directed by Ridley Scott")
    {
      id: 'ent-2',
      title: 'Gladiator II',
      creator: 'Ridley Scott',
      venue: 'IFI Cinema', // Included, but Film logic ignores venue to show Director
      kind: 'film',
      event_date: '2024-11-20',
      rating: 3.5,
      image_url: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmf4tcJOHjUnET.jpg'
    },
    // 3. BOOK (Should say "Written by...")
    {
      id: 'ent-1',
      title: 'Prophet Song',
      creator: 'Paul Lynch',
      kind: 'book',
      event_date: '2025-02-14',
      rating: 5,
      image_url: 'https://covers.openlibrary.org/b/id/14553193-L.jpg' 
    },
    // 4. EXHIBITION (Should say "Performed at/at National Gallery" depending on logic)
    {
      id: 'ent-4',
      title: 'Turner: The Sun is God',
      creator: 'National Gallery', 
      venue: 'National Gallery of Ireland', // <--- ADDED VENUE
      kind: 'exhibition',
      event_date: '2024-09-01',
      rating: 4,
      image_url: null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="bg-blue-600 text-white p-3 text-center font-bold text-sm mb-8 rounded-lg shadow-sm">
        ✅ TEST MODE: Checking Smart Labels (Performed at vs Directed by)
      </div>

      <div className="max-w-2xl mx-auto space-y-12">
        
        {/* SECTION A: PUBLIC EVENTS */}
        <div>
            <h2 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">1. Public Feed</h2>
            <div className="space-y-4">
                {publicEvents.map(item => (
                    <UniversalCard 
                        key={item.id} 
                        item={item} 
                        type="public" 
                        onAction={() => console.log('Log This Clicked')}
                    />
                ))}
            </div>
        </div>

        <div className="w-full h-px bg-gray-200"></div>

        {/* SECTION B: USER ENTRIES */}
        <div>
            <h2 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">2. Logged Entries</h2>
            <div className="space-y-4">
                {userEntries.map(item => (
                    <UniversalCard 
                        key={item.id} 
                        item={item} 
                        type="entry" 
                        onAction={() => console.log('Edit Clicked')}
                        onDelete={() => console.log('Delete Clicked')}
                    />
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}