import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const TM_API_KEY = import.meta.env.VITE_TICKETMASTER_KEY;

const CULTURE_IDS = [
  'KZFzniwnSyZfZ7v7nJ', // Music
  'KZFzniwnSyZfZ7v7na', // Arts & Theatre
  'KZFzniwnSyZfZ7v7nE'  // Film
].join(',');

export default function DublinEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `https://app.ticketmaster.com/discovery/v2/events.json?city=Dublin&classificationId=${CULTURE_IDS}&sort=date,asc&size=20&apikey=${TM_API_KEY}`
        );
        const data = await response.json();
        const upcoming = data._embedded?.events?.slice(0, 5) || [];
        setEvents(upcoming);
      } catch (error) {
        console.error('Failed to fetch events', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return null; 
  if (events.length === 0) return null;

  return (
    <div className="mb-12 animate-fade-in">
      <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
        <h2 className="text-xl font-bold text-gray-900">Upcoming in Dublin</h2>
        <Link to="/events" className="text-sm font-bold text-gray-400 hover:text-black transition-colors">
          View All →
        </Link>
      </div>
      
      <div className="space-y-3">
        {events.map((event) => {
          const date = new Date(event.dates.start.localDate);
          const month = date.toLocaleString('default', { month: 'short' });
          const day = date.getDate();
          
          // TIME FORMATTING (e.g., "19:30" -> "7:30 PM")
          let timeString = '';
          if (event.dates.start.localTime) {
            const [hours, minutes] = event.dates.start.localTime.split(':');
            const time = new Date();
            time.setHours(hours);
            time.setMinutes(minutes);
            timeString = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          }
          
          return (
            // LINK INTERNAL NOW
            <Link 
              key={event.id} 
              to={`/event/${event.id}`}
              className="group flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-black transition-all duration-200"
            >
              {/* DATE COLUMN */}
              <div className="flex-shrink-0 w-12 text-center">
                <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{month}</div>
                <div className="text-xl font-black text-gray-900 leading-none">{day}</div>
              </div>
              
              <div className="w-px h-8 bg-gray-100"></div>

              {/* CONTENT */}
              <div className="flex-grow min-w-0">
                <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {event.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                  <span>{event._embedded?.venues?.[0]?.name}</span>
                  {timeString && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{timeString}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-gray-300 group-hover:text-black transition-colors">→</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}