import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import EntryList from '../components/EntryList';

export default function History() {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null); // <--- 1. Add Session State
  
  // FILTERS
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState('');
  
  // UI STATE
  const [showFilters, setShowFilters] = useState(false); 

  const navigate = useNavigate();
  const location = useLocation();

  // 1. GET SESSION
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  // 2. Check for incoming "Stats" click
  useEffect(() => {
    if (location.state?.initialCategory) {
      setCategory(location.state.initialCategory);
      setShowFilters(true); 
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // 3. FETCH DATA (Only when session is ready)
  useEffect(() => {
    if (session) {
      fetchEntries();
    }
  }, [session]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', session.user.id) // <--- 4. THE FIX: Filter by your specific ID
      .order('event_date', { ascending: false });

    if (error) console.error(error);
    else {
      setEntries(data);
      setFilteredEntries(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    let result = entries;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.creator?.toLowerCase().includes(q)
      );
    }
    if (category) {
      result = result.filter(e => e.kind === category);
    }
    if (rating) {
      result = result.filter(e => e.rating === parseInt(rating));
    }
    setFilteredEntries(result);
  }, [search, category, rating, entries]);

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setRating('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (!error) fetchEntries();
  };

  const inputClass = "w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 appearance-none";
  const labelClass = "block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 min-h-screen animate-fade-in">
      
      {/* HEADER */}
      <div className="mb-6 flex justify-between items-center">
        <Link to="/" className="text-sm font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-2">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">My History</h1>
          <p className="text-gray-500">All your logged culture entries.</p>
        </div>
        
        {/* TOGGLE BUTTON */}
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm font-bold text-black border-b-2 border-black pb-0.5 hover:opacity-70 transition-opacity"
        >
          {showFilters ? 'Hide Filters' : 'Search & Filter'}
        </button>
      </div>

      {/* COLLAPSIBLE FILTER BAR */}
      {showFilters && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-8 animate-fade-in">
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Search</label>
              <input 
                type="text" 
                placeholder="Search title or creator..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className={labelClass}>Category</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} cursor-pointer`}>
                    <option value="">All Types</option>
                    <option value="book">Book</option>
                    <option value="film">Film</option>
                    <option value="concert">Concert</option>
                    <option value="theatre">Theatre</option>
                    <option value="exhibition">Exhibition</option>
                  </select>
                  <div className="absolute right-4 top-4 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className={labelClass}>Rating</label>
                <div className="relative">
                  <select value={rating} onChange={(e) => setRating(e.target.value)} className={`${inputClass} cursor-pointer`}>
                    <option value="">Any</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                  </select>
                  <div className="absolute right-4 top-4 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
              </div>

              <div className="hidden sm:block"></div>

              <div className="col-span-2 sm:col-span-1 flex items-end">
                 <button onClick={handleReset} className="w-full h-12 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors text-xs uppercase tracking-wide">
                    Reset
                  </button>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs font-bold text-gray-400 text-right">
             Found {filteredEntries.length} entries
          </div>
        </div>
      )}

      {/* ENTRIES LIST */}
      {loading ? (
         <div className="text-center py-12 text-gray-400">Loading your history...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-8">
          <p className="text-gray-400 font-medium">No entries match.</p>
          {!showFilters && <button onClick={() => setShowFilters(true)} className="text-blue-600 font-bold text-sm mt-2">Open Filters</button>}
        </div>
      ) : (
        <EntryList 
          entries={filteredEntries} 
          onDelete={handleDelete}
          onEdit={(entry) => navigate('/', { state: { editEntry: entry } })} 
        />
      )}
    </div>
  );
}