import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Greeting from '../components/Greeting';
import EntryForm from '../components/EntryForm';
import EntryList from '../components/EntryList';
import Stats from '../components/Stats';
import Filters from '../components/Filters';

const PAGE_SIZE = 5;

export default function Dashboard({ session }) {
  // DATA STATES
  const [entries, setEntries] = useState([]);      
  const [statsData, setStatsData] = useState([]);   
  const [totalResults, setTotalResults] = useState(0); 

  // UI STATES
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0); 
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState({
    kind: 'all',
    rating: 'all',
    sort: 'newest',
    search: ''
  });

  // 1. Fetch Stats (Only runs once)
  const fetchStats = useCallback(async () => {
    const { data, error } = await supabase.from('entries').select('kind'); 
    if (!error) setStatsData(data);
  }, []);

  // 2. Fetch Entries (Runs when filters change)
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
    
    if (error) {
      console.error('Error fetching:', error);
    } else {
      if (pageNumber === 0) setEntries(data);
      else setEntries((prev) => [...prev, ...data]);

      setTotalResults(count); 
      if ((pageNumber * PAGE_SIZE) + data.length >= count) setHasMore(false);
      else setHasMore(true);
    }
  }, [filters]); 

  // --- EFFECT 1: Run ONCE on mount ---
  useEffect(() => {
    fetchStats(); 
  }, [fetchStats]);

  // --- EFFECT 2: Run whenever FILTERS change (and initially) ---
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchEntries(0, filters);
  }, [filters, fetchEntries]); // Now cleanly depends on filters

  const addEntry = async (formData) => {
    const { error } = await supabase.from('entries').insert([{ user_id: session.user.id, ...formData, status: 'past' }]);
    if (error) alert(error.message);
    else {
      fetchEntries(0);
      fetchStats();
      setShowForm(false);
    }
  };

  const updateEntry = async (id, formData) => {
    const { error } = await supabase.from('entries').update(formData).eq('id', id);
    if (error) alert(error.message);
    else {
      fetchEntries(0);
      fetchStats();
      setShowForm(false);
      setEntryToEdit(null);
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      fetchEntries(0);
      fetchStats();
    }
  };

  const handleEditClick = (entry) => {
    setEntryToEdit(entry);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEntries(nextPage, filters);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>CultureTab</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ fontSize: "12px", padding: "5px 10px" }}>
          Sign Out
        </button>
      </header>
      
      <main>
        <Greeting />
        <Stats entries={statsData} />

        <button 
          onClick={() => { setShowForm(!showForm); setEntryToEdit(null); }}
          style={{ width: "100%", padding: "15px", backgroundColor: showForm ? "#eee" : "#222", color: showForm ? "#333" : "#fff", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer", marginBottom: "20px", fontWeight: "bold" }}
        >
          {showForm ? "Cancel" : "+ Log New Entry"}
        </button>
        
        {showForm && (
          <EntryForm onAddEntry={addEntry} onUpdateEntry={updateEntry} entryToEdit={entryToEdit} setEntryToEdit={setEntryToEdit} />
        )}
        
        <Filters filters={filters} setFilters={setFilters} />
        
        <div style={{ minHeight: "60vh" }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px", fontStyle: "italic" }}>
            {totalResults === 0 ? "No entries found." : `Showing ${entries.length} of ${totalResults} entries`}
          </div>

          <EntryList entries={entries} onDelete={deleteEntry} onEdit={handleEditClick} />

          {hasMore && (
            <button onClick={loadMore} style={{ display: "block", width: "100%", margin: "20px auto", padding: "12px", backgroundColor: "white", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer", color: "#555" }}>
              Load More ↓
            </button>
          )}
        </div>
      </main>
    </div>
  );
}