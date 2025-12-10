import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TM_API_KEY = import.meta.env.VITE_TICKETMASTER_KEY;

export default function PublicEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(
          `https://app.ticketmaster.com/discovery/v2/events/${id}.json?apikey=${TM_API_KEY}`
        );
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400 font-bold">Loading Event...</div></div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  // Format Data
  const img = event.images.find(i => i.width > 600)?.url || event.images[0].url;
  const dateObj = new Date(event.dates.start.localDate);
  const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  let timeStr = '';
  if (event.dates.start.localTime) {
    const [h, m] = event.dates.start.localTime.split(':');
    const d = new Date(); d.setHours(h); d.setMinutes(m);
    timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  const venue = event._embedded?.venues?.[0];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      
      {/* Back Button */}
      <div className="max-w-3xl mx-auto mb-6">
        <button onClick={() => navigate(-1)} className="text-sm font-bold text-gray-400 hover:text-black transition-colors">
          ← Back
        </button>
      </div>

      <article className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
        
        {/* HERO IMAGE */}
        <div className="h-64 sm:h-96 w-full bg-gray-200 relative">
          <img src={img} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold uppercase tracking-widest mb-3 border border-white/30">
              {event.classifications?.[0]?.segment?.name || 'Event'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight shadow-sm">
              {event.name}
            </h1>
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-10">
            
            {/* Left: Info */}
            <div className="flex-grow space-y-6">
              
              {/* Date & Time */}
              <div className="flex items-start gap-4">
                <div className="w-10 pt-1 text-center text-2xl">📅</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Date & Time</h3>
                  <p className="text-gray-600">{dateStr}</p>
                  {timeStr && <p className="text-gray-500">{timeStr}</p>}
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-start gap-4">
                <div className="w-10 pt-1 text-center text-2xl">📍</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Location</h3>
                  <p className="text-gray-600">{venue?.name}</p>
                  <p className="text-gray-500 text-sm">
                    {venue?.address?.line1}, {venue?.city?.name}
                  </p>
                </div>
              </div>

              {/* Description (if available) */}
              {event.info && (
                <div className="pt-4 border-t border-gray-100 mt-6">
                  <h3 className="font-bold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600 leading-relaxed">{event.info}</p>
                </div>
              )}
            </div>

            {/* Right: Action Box */}
            <div className="md:w-72 flex-shrink-0">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 sticky top-6">
                <div className="text-center mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className={`font-bold ${event.dates.status.code === 'onsale' ? 'text-green-600' : 'text-red-600'}`}>
                    {event.dates.status.code === 'onsale' ? 'Tickets Available' : 'Sold Out / Unavailable'}
                  </p>
                </div>

                <a 
                  href={event.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-black text-white font-bold text-center py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98]"
                >
                  Get Tickets ↗
                </a>
                
                <p className="text-center text-[10px] text-gray-400 mt-4">
                  You will be redirected to the ticket provider.
                </p>
              </div>
            </div>

          </div>
        </div>
      </article>
    </div>
  );
}