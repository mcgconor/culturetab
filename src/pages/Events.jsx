import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import UniversalCard from '../components/UniversalCard';
import EntryForm from '../components/EntryForm';
import Filters from '../components/Filters';
import { Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

async function fetchDirector(title) {
    if (!TMDB_API_KEY || !title) return '';
    try {
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

function mapCategoryToKind(cat) {
    if (!cat) return 'book'; 
    const c = cat.toLowerCase();
    if (c === 'music' || c === 'gig') return 'concert';
    if (c === 'art' || c === 'museum') return 'exhibition';
    if (c === 'play' || c === 'drama') return 'theatre';
    return c; 
}

export default function Events({ session, logTrigger }) {
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', kind: 'all', date: '', rating: 'all' });
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [preFillData, setPreFillData] = useState(null);
  const navigate = useNavigate();
  const prevLogTrigger = useRef(logTrigger);

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    if (logTrigger > prevLogTrigger.current) {
      setShowEntryForm(true);
      prevLogTrigger.current = logTrigger;
    }
  }, [logTrigger]);

  useEffect(() => {
    if (!allEvents.length) return;
    let result = allEvents;
    if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(e => e.title.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q));
    }
    if (filters.kind !== 'all') {
        result = result.filter(e => mapCategoryToKind(e.category) === filters.kind);
    }
    if (filters.date) {
        result = result.filter(e => e.start_date.startsWith(filters.date));
    }
    setFilteredEvents(result);
  }, [filters, allEvents]);

  const fetchEvents = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('public_events').select('*').gt('start_date', now).order('start_date', { ascending: true });
    if (error) console.error(error);
    else { setAllEvents(data || []); setFilteredEvents(data || []); }
    setLoading(false);
  };

  const handleLogThis = async (item) => {
    const kind = mapCategoryToKind(item.category);
    let directorName = '';
    if (kind === 'film' || kind === 'movie') directorName = await fetchDirector(item.title);
    setPreFillData({
        title: item.title,
        kind: kind,
        event_date: item.start_date ? item.start_date.split('T')[0] : '',
        image_url: item.image_url,
        creator: directorName
    });
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
    } catch (error) { alert(`Supabase Error: ${error.message}`); }
  };

  return (
    <div className="animate-fade-in relative">
      <div className="pt-8 px-4">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">Upcoming Events</h1>
        <p className="text-lg text-gray-500 max-w-xl leading-relaxed mb-6">See what's happening around Dublin.</p>
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-xl py-2 -mx-4 px-4 border-b border-gray-50 mb-6 transition-all">
            <Filters filters={filters} setFilters={setFilters} showRating={false} />
        </div>
      </div>

      <div className="px-4">
        {loading ? <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>)}</div> :
         filteredEvents.length === 0 ? <div className="text-center py-20 text-gray-400">No events found matching your filters.</div> :
         <div className="space-y-4">{filteredEvents.map(item => <UniversalCard key={item.id} item={item} type="public" onAction={handleLogThis} />)}</div>}
      </div>

      {/* FULL SCREEN MODAL */}
      {showEntryForm && (
        <div className="fixed inset-0 z-[100] bg-white sm:bg-black/60 sm:backdrop-blur-sm flex items-start justify-center overflow-y-auto animate-fade-in">
            <div className="w-full min-h-screen bg-white sm:min-h-0 sm:mt-10 sm:max-w-2xl sm:rounded-2xl sm:shadow-2xl relative">
                <button onClick={() => setShowEntryForm(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-50 sm:hidden">
                    <X className="w-5 h-5 text-gray-900" />
                </button>
                <button onClick={() => setShowEntryForm(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10 hidden sm:block">
                    <Plus className="w-5 h-5 transform rotate-45 text-gray-500" />
                </button>
                <EntryForm initialData={preFillData} onAddEntry={handleAddEntry} onCancel={() => setShowEntryForm(false)} />
            </div>
        </div>
      )}
    </div>
  );
}