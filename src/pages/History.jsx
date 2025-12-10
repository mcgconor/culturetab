import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import EntryList from '../components/EntryList';
import EntryForm from '../components/EntryForm'; 
import Filters from '../components/Filters';

const PAGE_SIZE = 10;

export default function History({ session }) { 
  const [entries, setEntries] = useState([]);      
  const [totalResults, setTotalResults] = useState(0); 
  const [page, setPage] = useState(0); 
  const [hasMore, setHasMore] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);

  const [filters, setFilters] = useState({
    kind: 'all', rating: 'all', sort: 'newest', search: ''
  });

  const fetchEntries = useCallback(async (pageNumber = 0, currentFilters = filters) => {
    const from = pageNumber * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('entries').select('*', { count: 'exact' });

    if (currentFilters.search && currentFilters.search.trim() !== '') {
      const term = currentFilters.search.trim();
      query = query.or(`title.ilike.%${term}%,creator.ilike.%${term}%`);
    }

    if (currentFilters.kind !== 'all') query = query.eq('kind', currentFilters.kind);
    if (currentFilters.rating !== 'all') query = query.gte('rating', parseInt(currentFilters.rating));

    if (currentFilters.sort === 'newest') query = query.order('event_date', { ascending: false });
    else if (currentFilters.sort === 'oldest') query = query.order('event_date', { ascending: true });
    else if (currentFilters.sort === 'highest') query = query.order('rating', { ascending: false });

    const { data, count, error } = await query.range(from, to);
    
    if (error) console.error('Error fetching:', error);
    else {
      if (pageNumber === 0) setEntries(data);
      else setEntries((prev) => [...prev, ...data]);

      setTotalResults(count); 
      if ((pageNumber * PAGE_SIZE) + data.length >= count) setHasMore(false);
      else setHasMore(true);
    }
  }, [filters]); 

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchEntries(0, filters);
  }, [filters, fetchEntries]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEntries(nextPage, filters);
  };

  const addEntry = async (formData) => {
    const { error } = await supabase.from('entries').insert([{ user_id: session.user.id, ...formData, status: 'past' }]);
    if (error) alert(error.message);
    else {
      fetchEntries(0); 
      setShowForm(false);
    }
  };

  const updateEntry = async (id, formData) => {
    const { error } = await supabase.from('entries').update(formData).eq('id', id);
    if (error) alert(error.message);
    else {
      fetchEntries(0);
      setShowForm(false);
      setEntryToEdit(null);
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchEntries(0);
  };

  const handleEditClick = (entry) => {
    setEntryToEdit(entry);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="flex items-center mb-8 gap-4">
        <Link to="/" className="text-xl text-gray-400 hover:text-black transition-colors">←</Link>
        <h1 className="text-2xl font-bold text-gray-900">Full History</h1>
      </header>
      
      {/* BUTTON: Only show if form is CLOSED */}
      {!showForm && (
        <button 
          onClick={() => { setShowForm(true); setEntryToEdit(null); }}
          className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-md hover:bg-gray-800 transition-all active:scale-[0.98] mb-8"
        >
          + Log New Entry
        </button>
      )}

      {/* FORM */}
      {showForm && (
        <EntryForm 
          onAddEntry={addEntry} 
          onUpdateEntry={updateEntry} 
          entryToEdit={entryToEdit} 
          setEntryToEdit={setEntryToEdit}
          onCancel={() => { setShowForm(false); setEntryToEdit(null); }} 
        />
      )}

      <Filters filters={filters} setFilters={setFilters} />
        
      <div className="min-h-[60vh]">
        <div className="text-sm text-gray-500 mb-4 italic">
          {totalResults === 0 ? "No entries found." : `Showing ${entries.length} of ${totalResults} entries`}
        </div>

        <EntryList entries={entries} onDelete={deleteEntry} onEdit={handleEditClick} />

        {hasMore && (
          <button onClick={loadMore} className="w-full mt-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-colors">
            Load More ↓
          </button>
        )}
      </div>
    </div>
  );
}