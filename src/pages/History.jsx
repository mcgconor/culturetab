import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import EntryList from '../components/EntryList';

export default function History() {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // FILTERS
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) console.error(error);
    else {
      setEntries(data);
      setFilteredEntries(data);
    }
    setLoading(false);
  };

  // Instant Client Filtering
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

  // COMMON STYLES
  const inputClass = "w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400";
  const labelClass = "block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 min-h-screen animate-fade-in">
      
      {/* 1. TOP NAV */}
      <div className="mb-6">
        <Link 
          to="/" 
          className="text-sm font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-2"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">My History</h1>
        <p className="text-gray-500">All your logged culture entries.</p>
      </div>

      {/* 2. FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-8">
        
        {/* Row 1: Search & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Search</label>
            <input 
              type="text" 
              placeholder="Search title or creator..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className={`${inputClass} appearance-none cursor-pointer`}
            >
              <option value="">All Categories</option>
              <option value="book">Book</option>
              <option value="film">Film</option>
              <option value="concert">Concert</option>
              <option value="theatre">Theatre</option>
              <option value="exhibition">Exhibition</option>
            </select>
          </div>
        </div>

        {/* Row 2: Rating & Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
           <div>
            <label className={labelClass}>Rating</label>
            <select 
              value={rating} 
              onChange={(e) => setRating(e.target.value)}
              className={`${inputClass} appearance-none cursor-pointer`}
            >
              <option value="">Any Rating</option>
              <option value="5">★★★★★ (5)</option>
              <option value="4">★★★★ (4+)</option>
              <option value="3">★★★ (3+)</option>
            </select>
          </div>
          
          <div className="col-span-1">
             <button 
                onClick={handleReset}
                type="button"
                className="w-full h-12 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                Reset Filters
              </button>
          </div>
          
          <div className="hidden sm:flex justify-end items-center h-12 text-xs font-bold text-gray-400">
             Found {filteredEntries.length} entries
          </div>
        </div>
      </div>

      {/* 3. ENTRIES LIST */}
      {loading ? (
         <div className="text-center py-12 text-gray-400">Loading your history...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-8">
          <p className="text-gray-400 font-medium">No entries match your filters.</p>
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