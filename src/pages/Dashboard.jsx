import { useEffect, useState, useRef } from 'react'; // Added useRef
import { supabase } from '../supabaseClient';
import UnifiedFeed from '../components/UnifiedFeed'; 
import EntryForm from '../components/EntryForm'; 
import { Plus } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// HELPER: Fetch Director
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

export default function Dashboard({ session: propSession, logTrigger }) {
  const [session, setSession] = useState(propSession);
  const [profile, setProfile] = useState(null);
  
  // MODAL STATES
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null); 
  const [preFillData, setPreFillData] = useState(null); 

  const [feedKey, setFeedKey] = useState(0); 
  const navigate = useNavigate();

  // FIX: Track the previous trigger value so we don't open on mount
  const prevLogTrigger = useRef(logTrigger);

  // LISTEN FOR HEADER CLICK (From Layout)
  useEffect(() => {
    // Only open if the trigger has INCREASED since the last render
    if (logTrigger > prevLogTrigger.current) {
      handleOpenNew();
      prevLogTrigger.current = logTrigger;
    }
  }, [logTrigger]);

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
    if (session?.user) {
        getProfile(session.user.id);
    }
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

    if (kind === 'film' || kind === 'movie') {
        directorName = await fetchDirector(item.title);
    }

    setPreFillData({
        title: item.title,
        kind: kind,
        event_date: item.start_date ? item.start_date.split('T')[0] : '',
        image_url: item.image_url,
        creator: directorName
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
    <div className="animate-fade-in relative">
      
      {/* 1. WELCOME SECTION */}
      <div className="pt-8 pb-6 px-4">
         <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            Welcome back, {profile?.username || 'there'}.
         </h1>
         <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
            Ready to keep tabs on your latest culture fix?
         </p>
         <div className="h-px bg-gray-100 w-full mt-8 mb-8"></div>
      </div>

      {/* 2. FEED */}
      <div className="px-4">
         <UnifiedFeed 
            key={feedKey} 
            session={session} 
            onEdit={handleEditTrigger} 
            onLogPublic={handleLogPublicEvent} 
         /> 
      </div>

      {/* 3. MODAL */}
      {showEntryForm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full h-[85vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl relative">
                <button 
                  onClick={closeModal}
                  className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"
                >
                  <Plus className="w-5 h-5 transform rotate-45 text-gray-500" />
                </button>

                <EntryForm 
                    entryToEdit={entryToEdit} 
                    initialData={preFillData}
                    onAddEntry={handleAddEntry}
                    onUpdateEntry={handleUpdateEntry}
                    onCancel={closeModal}
                />
            </div>
        </div>
      )}

    </div>
  );
}