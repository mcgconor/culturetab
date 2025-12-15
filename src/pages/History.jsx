import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import UniversalCard from '../components/UniversalCard';
import EntryForm from '../components/EntryForm';
import Filters from '../components/Filters';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function History({ session: propSession, logTrigger }) {
  const [allEntries, setAllEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UNIFIED FILTER STATE
  const [filters, setFilters] = useState({
    search: '',
    kind: 'all',
    date: '',
    rating: 'all' 
  });

  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);
  
  const navigate = useNavigate();

  // LISTEN FOR HEADER CLICK
  useEffect(() => {
    if (logTrigger > 0) setShowEntryForm(true);
  }, [logTrigger]);

  useEffect(() => {
    let userId = propSession?.user?.id;
    if (userId) fetchHistory(userId);
    else {
        supabase.auth.getSession().then(({ data }) => {
            if (data?.session?.user) fetchHistory(data.session.user.id);
            else setLoading(false);
        });
    }
  }, [propSession]);

  useEffect(() => {
    if (!allEntries.length) return;
    let result = allEntries;

    if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(e => e.title.toLowerCase().includes(q) || e.creator?.toLowerCase().includes(q));
    }
    if (filters.kind !== 'all') {
        result = result.filter(e => e.kind === filters.kind);
    }
    if (filters.date) {
        result = result.filter(e => e.event_date === filters.date);
    }
    if (filters.rating !== 'all') {
        const minRating = Number(filters.rating);
        result = result.filter(e => e.rating >= minRating);
    }
    setFilteredEntries(result);
  }, [filters, allEntries]);

  const fetchHistory = async (userId) => {
    try {
        setLoading(true);
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('user_id', userId)
          .order('event_date', { ascending: false });

        if (error) throw error;
        setAllEntries(data || []);
        setFilteredEntries(data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleUpdateEntry = async (id, formData) => {
    try {
        const { sortDate, type, ...cleanData } = formData;
        const { error } = await supabase.from('entries').update(cleanData).eq('id', id);
        if (error) throw error;
        
        const updatedList = allEntries.map(item => item.id === id ? { ...item, ...cleanData } : item);
        setAllEntries(updatedList);
        setShowEntryForm(false);
        setEntryToEdit(null);
    } catch (error) {
        alert(`Update Error: ${error.message}`);
    }
  };

  const handleEditTrigger = (item) => {
    setEntryToEdit(item);
    setShowEntryForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this memory?")) return;
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (!error) {
        const remaining = allEntries.filter(item => item.id !== id);
        setAllEntries(remaining);
    }
  };

  return (
    <div className="animate-fade-in relative">
      
      <div className="pt-8 px-4">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            Your History
        </h1>
        <p className="text-lg text-gray-500 max-w-xl leading-relaxed mb-6">
            A collection of everything you've watched, read, and attended.
        </p>

        {/* STICKY FILTERS */}
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-xl py-2 -mx-4 px-4 border-b border-gray-50 mb-6 transition-all">
            <Filters filters={filters} setFilters={setFilters} showRating={true} />
        </div>
      </div>

      <div className="px-4">
        {loading ? (
             <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>)}</div>
        ) : filteredEntries.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-500 font-medium">No results match your filters.</p>
                <button onClick={() => setFilters({search: '', kind: 'all', date: '', rating: 'all'})} className="mt-4 text-black font-bold underline text-sm">Clear Filters</button>
            </div>
        ) : (
            <div className="space-y-4">
                {filteredEntries.map(item => (
                    <UniversalCard 
                        key={item.id} 
                        item={item}
                        type="entry"
                        onAction={handleEditTrigger}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        )}
      </div>

      {/* MODAL */}
      {showEntryForm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full h-[85vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl relative">
                <button onClick={() => setShowEntryForm(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10">
                    <Plus className="w-5 h-5 transform rotate-45 text-gray-500" />
                </button>
                <EntryForm entryToEdit={entryToEdit} onUpdateEntry={handleUpdateEntry} onCancel={() => setShowEntryForm(false)} onAddEntry={() => {}} />
            </div>
        </div>
      )}
    </div>
  );
}