import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import UnifiedFeed from '../components/UnifiedFeed'; 
import EntryForm from '../components/EntryForm'; 
import { Plus } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// FIX: Removed 'dateString' param. We now search by TITLE ONLY.
async function fetchDirector(title) {
    if (!TMDB_API_KEY || !title) return '';

    try {
        // 1. Search by Title (No year restriction)
        const searchRes = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
        );
        const searchData = await searchRes.json();
        const movie = searchData.results?.[0]; // Best match

        if (!movie) return '';

        // 2. Fetch Credits
        const creditsRes = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`
        );
        const creditsData = await creditsRes.json();
        
        // 3. Find Director
        const director = creditsData.crew?.find(person => person.job === 'Director');
        return director ? director.name : '';
    } catch (e) {
        console.error("Director fetch failed:", e);
        return ''; 
    }
}

function mapCategoryToKind(cat) {
    if (!cat) return 'book'; 
    const c = cat.toLowerCase();
    if (c === 'music' || c === 'gig') return 'concert';
    if (c === 'art' || c === 'museum') return 'exhibition';
    if (c === 'play' || c === 'drama') return 'theatre';
    return c; 
}

export default function Dashboard({ session: propSession }) {
  const [session, setSession] = useState(propSession);
  const [profile, setProfile] = useState(null);
  
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null); 
  const [preFillData, setPreFillData] = useState(null); 

  const [feedKey, setFeedKey] = useState(0); 
  const navigate = useNavigate();

  useEffect(() => {
    if (propSession?.user) {
        setSession(propSession);
    } else {
        supabase.auth.getSession().then(({ data }) => {
            if (data?.session) setSession(data.session);
        });
    }
  }, [propSession]);

  useEffect(() => {
    if (session?.user) getProfile(session.user.id);
  }, [session]);

  const getProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  };

  const handleOpenNew = () => {
    setEntryToEdit(null);
    setPreFillData(null);
    setShowEntryForm(true);
  };

  const handleLogPublicEvent = async (item) => {
    const kind = mapCategoryToKind(item.category);
    let directorName = '';

    // Only fetch director if it's a movie
    if (kind === 'film' || kind === 'movie') {
        directorName = await fetchDirector(item.title);
    }

    setPreFillData({
        title: item.title,
        kind: kind,
        event_date: item.start_date ? item.start_date.split('T')[0] : '',
        image_url: item.image_url,
        creator: directorName // Will be the director name or empty string
    });
    setEntryToEdit(null);
    setShowEntryForm(true);
  };

  const handleAddEntry = async (formData) => {
    if (!session?.user) return; 
    const { id, ...cleanData } = formData;
    try {
        const { error } = await supabase.from('entries').insert([{ ...cleanData, user_id: session.user.id }]);
        if (error) throw error; 
        closeModal();
        setFeedKey(prev => prev + 1); 
    } catch (error) {
        alert(`Supabase Error: ${error.message}`);
    }
  };

  const handleUpdateEntry = async (id, formData) => {
    try {
        const { sortDate, type, ...cleanData } = formData;
        const { error } = await supabase.from('entries').update(cleanData).eq('id', id);
        if (error) throw error;
        closeModal();
        setFeedKey(prev => prev + 1); 
    } catch (error) {
        alert(`Update Error: ${error.message}`);
    }
  };

  const handleEditTrigger = (item) => {
    setEntryToEdit(item); 
    setPreFillData(null);
    setShowEntryForm(true); 
  };

  const closeModal = () => {
    setShowEntryForm(false);
    setEntryToEdit(null);
    setPreFillData(null);
  };

  return (
    <div className="min-h-screen bg-white animate-fade-in relative">
      <div className="max-w-3xl mx-auto pt-10 pb-6 px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                    Welcome back, {profile?.username || 'there'}.
                </h1>
                <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
                    Ready to log your latest culture fix? Track your books, films, and art here.
                </p>
            </div>
            <button onClick={handleOpenNew} className="bg-black text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-gray-800 transition-transform active:scale-95 shadow-md flex items-center gap-2 whitespace-nowrap">
                <Plus className="w-4 h-4" /> Log New Entry
            </button>
        </div>
        <div className="h-px bg-gray-100 w-full mt-10 mb-8"></div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
         <UnifiedFeed key={feedKey} session={session} onEdit={handleEditTrigger} onLogPublic={handleLogPublicEvent} /> 
      </div>

      {showEntryForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl relative">
                <button onClick={closeModal} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10">
                  <Plus className="w-5 h-5 transform rotate-45 text-gray-500" />
                </button>
                <EntryForm entryToEdit={entryToEdit} initialData={preFillData} onAddEntry={handleAddEntry} onUpdateEntry={handleUpdateEntry} onCancel={closeModal} />
            </div>
        </div>
      )}
    </div>
  );
}