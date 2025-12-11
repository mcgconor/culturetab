import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function PublicEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      // Fetch the specific event by ID
      const { data, error } = await supabase
        .from('public_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching event:", error);
      } else if (data) {
        setEvent(data);
      }
      setLoading(false);
    };

    if (id) fetchEvent();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading details...</div>;
  
  if (!event) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h2>
      <button onClick={() => navigate('/events')} className="text-blue-600 font-bold hover:underline">
        Back to Calendar
      </button>
    </div>
  );

  // Date Formatting (Safe)
  let dateStr = "Date TBA";
  let timeStr = "Time TBA";
  let dayNum = "?";
  let monthStr = "";
  
  if (event.start_date) {
    const dateObj = new Date(event.start_date);
    if (!isNaN(dateObj)) {
      dateStr = dateObj.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
      timeStr = dateObj.toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit' });
      dayNum = dateObj.getDate();
      monthStr = dateObj.toLocaleString('default', { month: 'short' });
    }
  }

  // --- BUTTON TEXT LOGIC (Fixed for Safety) ---
  let buttonText = 'View Event';
  const url = event.external_url || ''; // Safe Fallback to empty string

  if (event.source === 'ticketmaster') {
    buttonText = 'Get Tickets on Ticketmaster';
  } else if (event.source === 'journalofmusic') {
    // Check if the URL exists AND contains the journal domain
    if (url && url.includes('journalofmusic.com')) {
      buttonText = 'Read on Journal of Music';
    } else {
      buttonText = 'Visit Website';
    }
  }
  // ---------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 animate-fade-in">
      
      {/* NAV */}
      <div className="max-w-4xl mx-auto mb-6">
        <button 
          onClick={() => navigate('/events')} 
          className="text-sm font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-2"
        >
          ← Back to Calendar
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        <div className="flex flex-col md:flex-row">
          
          {/* IMAGE SECTION */}
          <div className="md:w-2/5 h-64 md:h-auto bg-gray-100 relative">
            {event.image_url ? (
              <img 
                src={event.image_url} 
                alt={event.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.style.display = 'none'; }} // Hide if broken
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300 font-bold text-2xl uppercase">
                {event.category || 'Event'}
              </div>
            )}
          </div>

          {/* CONTENT SECTION */}
          <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Category Pill */}
              <span className="inline-block px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-4">
                {event.category || 'Event'}
              </span>

              <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-2">
                {event.title}
              </h1>
              
              <div className="text-lg font-bold text-gray-500 mb-6 flex items-center gap-2">
                📍 {event.venue}
              </div>

              {/* Date Box */}
              <div className="flex items-center gap-4 py-4 border-y border-gray-100 mb-6">
                <div className="text-center px-2">
                   <div className="text-xs font-bold text-red-600 uppercase">{monthStr}</div>
                   <div className="text-2xl font-black text-gray-900 leading-none">{dayNum}</div>
                </div>
                <div className="h-8 w-px bg-gray-100"></div>
                <div>
                   <div className="text-sm font-bold text-gray-900">{dateStr}</div>
                   <div className="text-xs text-gray-500">{timeStr !== '00:00' ? `Doors: ${timeStr}` : 'Time TBA'}</div>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div className="prose prose-sm prose-gray max-w-none text-gray-600 mb-8 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              )}
            </div>

            {/* ACTION BUTTON */}
            {event.external_url && (
              <div className="mt-4 pt-6 border-t border-gray-50">
                <a 
                  href={event.external_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full text-center bg-black text-white h-12 leading-[48px] rounded-xl font-bold hover:bg-gray-800 transition-colors"
                >
                  {buttonText} →
                </a>
                <p className="text-center text-[10px] text-gray-300 mt-2">
                  Sourced from {event.source}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}