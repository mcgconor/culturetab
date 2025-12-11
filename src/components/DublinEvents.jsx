import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

export default function DublinEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      // Logic: Show next 5 events starting from right now
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('public_events')
        .select('*')
        .gte('start_date', now)
        .order('start_date', { ascending: true })
        .limit(5);

      if (!error) setEvents(data);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded-xl mb-8"></div>;
  if (events.length === 0) return null;

  return (
    <div className="mb-12 animate-fade-in">
      
      {/* HEADER: Matches screenshot "Upcoming in Dublin" + "View All ->" */}
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-bold text-gray-900">Upcoming in Dublin</h2>
        <Link to="/events" className="text-sm font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-1">
          View All →
        </Link>
      </div>

      {/* LIST */}
      <div className="flex flex-col gap-3">
        {events.map((event) => {
          const dateObj = new Date(event.start_date);
          const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase(); // "DEC"
          const day = dateObj.getDate(); // "10"
          const timeStr = dateObj.toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit' }); // "19:00"

          return (
            <Link 
              key={event.id} 
              to={`/event/${event.id}`}
              className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-black transition-all flex items-center shadow-sm"
            >
              {/* 1. DATE BLOCK (Left Side) */}
              <div className="flex-shrink-0 w-12 text-center mr-4">
                <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-0.5">
                  {month}
                </div>
                <div className="text-2xl font-black text-gray-900 leading-none">
                  {day}
                </div>
              </div>

              {/* VERTICAL DIVIDER */}
              <div className="w-px h-10 bg-gray-100 mr-4 hidden sm:block"></div>

              {/* 2. CONTENT (Middle) */}
              <div className="flex-grow min-w-0">
                <h3 className="font-bold text-gray-900 text-lg leading-tight truncate group-hover:text-blue-600 transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                  <span>{event.venue}</span>
                  <span className="text-gray-300">•</span>
                  <span>{timeStr}</span>
                </div>
              </div>

              {/* 3. ARROW (Right Side) */}
              <div className="text-gray-300 group-hover:text-black transition-colors pl-4">
                →
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}