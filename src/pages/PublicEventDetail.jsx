import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import EntryForm from '../components/EntryForm'; 
import { Plus, MapPin, Calendar, ExternalLink, Loader2 } from 'lucide-react'; 

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

function getHighResImageUrl(url) {
  if (!url) return null;
  if (url.includes('tmdb.org')) return url.replace(/\/w\d+\//, '/original/'); 
  if (url.includes('books.google.com')) return url.replace('&zoom=1', '&zoom=3'); 
  return url;
}

function getSourceName(event) {
    if (!event) return '';
    if (event.scraper_source && event.scraper_source.includes('IFI')) return 'Irish Film Institute';
    if (event.external_url) {
        try {
            const hostname = new URL(event.external_url).hostname;
            const cleanHost = hostname.replace('www.', '').replace('m.', '');
            if (cleanHost.includes('ticketmaster')) return 'Ticketmaster';
            if (cleanHost.includes('ifi.ie')) return 'Irish Film Institute';
            return cleanHost;
        } catch (error) { }
    }
    if (event.source === 'ticketmaster') return 'Ticketmaster';
    return event.source || 'External Source';
}

function mapCategoryToKind(cat) {
    if (!cat) return 'book'; 
    const c = cat.toLowerCase();
    if (c === 'music' || c === 'gig') return 'concert';
    if (c === 'art' || c === 'museum') return 'exhibition';
    if (c === 'play' || c === 'drama') return 'theatre';
    return c; 
}

// FIX: Removed Year Logic
async function fetchDirector(title) {
    if (!TMDB_API_KEY || !title) return '';
    try {
        // Search strictly by title
        const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
        const searchData = await searchRes.json();
        const movie = searchData.results?.[0];
        
        if (!movie) return '';

        const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`);
        const creditsData = await creditsRes.json();
        const director = creditsData.crew?.find(person => person.job === 'Director');
        return director ? director.name : '';
    } catch (e) { return ''; }
}

export default function PublicEventDetail({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [preFillData, setPreFillData] = useState(null);
  const [isPreparingLog, setIsPreparingLog] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase.from('public_events').select('*').eq('id', id).single();
      if (error) console.error(error);
      else setEvent(data);
      setLoading(false);
    };
    if(id) fetchEvent();
  }, [id]);

  const handleLogClick = async () => {
    setIsPreparingLog(true);
    const kind = mapCategoryToKind(event.category);
    let directorName = '';

    if (kind === 'film' || kind === 'movie') {
        directorName = await fetchDirector(event.title);
    }

    setPreFillData({
        title: event.title,
        kind: kind,
        event_date: event.start_date ? event.start_date.split('T')[0] : '',
        image_url: event.image_url,
        creator: directorName
    });

    setIsPreparingLog(false);
    setShowEntryForm(true);
  };

  const handleAddEntry = async (formData) => {
    try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) return alert('Please sign in');
        const { id, ...cleanData } = formData;
        const { error } = await supabase.from('entries').insert([{ ...cleanData, user_id: currentSession.user.id }]);
        if (error) throw error;
        setShowEntryForm(false);
        navigate('/history'); 
    } catch (error) {
        alert(`Supabase Error: ${error.message}`);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading...</div>;
  if (!event) return <div className="p-12 text-center">Event not found</div>;

  const highResImage = getHighResImageUrl(event.image_url);
  const eventDate = new Date(event.start_date);
  const ticketLink = event.external_url;
  const sourceLabel = getSourceName(event);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 animate-fade-in relative">
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="text-sm font-bold text-gray-400 hover:text-black">← Back</button>
        <button onClick={handleLogClick} disabled={isPreparingLog} className="bg-black text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-gray-800 transition-transform active:scale-95 shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait">
            {isPreparingLog ? <><Loader2 className="w-3 h-3 animate-spin" /> Fetching info...</> : <><Plus className="w-3 h-3" /> Log This</>}
        </button>
      </div>

      <article className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {highResImage && (
            <div className="w-full bg-gray-100 relative overflow-hidden flex justify-center items-center py-8 px-4">
               <div className="absolute inset-0 opacity-30 blur-2xl scale-110" style={{ backgroundImage: `url(${highResImage})`, backgroundPosition: 'center', backgroundSize: 'cover' }} />
               <img src={highResImage} alt={event.title} className="relative z-10 max-h-[500px] w-auto max-w-full shadow-lg rounded-lg" />
            </div>
        )}

        <div className="p-8 md:p-12">
             <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-600">
                  {event.category || 'Event'}
                </span>
             </div>

             <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 leading-tight">{event.title}</h1>
             
             <div className="flex items-center gap-2 text-xl text-gray-500 font-bold mb-8">
                <MapPin className="w-5 h-5 text-gray-400" />
                {event.venue || 'Dublin City'}
             </div>
             
             <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-10 pb-10 border-b border-gray-100">
               <Calendar className="w-4 h-4" />
               <span>Happening on {eventDate.toLocaleDateString('en-IE')} at {eventDate.toLocaleTimeString('en-IE', {hour: '2-digit', minute:'2-digit'})}</span>
             </div>

             {event.description && (
                <div className="mb-10">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">About this Event</h3>
                    <div className="prose prose-lg prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</div>
                </div>
             )}

             {ticketLink && (
                <div className="pt-8 border-t border-gray-100">
                    <a href={ticketLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-black text-white font-bold px-8 py-4 rounded-xl hover:bg-gray-800 transition-transform active:scale-95 shadow-md">
                        <span>More information</span>
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sourced by {sourceLabel}</p>
                </div>
             )}
        </div>
      </article>

      {showEntryForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl relative">
                <button onClick={() => setShowEntryForm(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"><Plus className="w-5 h-5 transform rotate-45 text-gray-500" /></button>
                <EntryForm initialData={preFillData} onAddEntry={handleAddEntry} onCancel={() => setShowEntryForm(false)} />
            </div>
        </div>
      )}
    </div>
  );
}