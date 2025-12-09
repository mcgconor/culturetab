import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Greeting from './components/Greeting';
import EntryForm from './components/EntryForm';
import EntryList from './components/EntryList';
import Stats from './components/Stats';
import Filters from './components/Filters';

const PAGE_SIZE = 5;

function App() {
  const [session, setSession] = useState(null);
  
  // DATA STATES
  const [entries, setEntries] = useState([]);       // The visible list (paginated)
  const [statsData, setStatsData] = useState([]);   // <--- NEW: The full list (for Stats widget only)
  const [totalResults, setTotalResults] = useState(0); // <--- NEW: Total count for current filter

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

  // --- 1. FETCH GLOBAL STATS (The "Big Picture") ---
  const fetchStats = async () => {
    // We only select 'kind' to keep this super fast and lightweight
    const { data, error } = await supabase
      .from('entries')
      .select('kind'); 
    
    if (!error) setStatsData(data);
  };

  // --- 2. FETCH LIST (With Search Logic) ---
  const fetchEntries = async (pageNumber = 0, currentFilters = filters) => {
    const from = pageNumber * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('entries')
      .select('*', { count: 'exact' });

    // 1. Apply Search (Title OR Creator)
    if (currentFilters.search && currentFilters.search.trim() !== '') {
      const term = currentFilters.search.trim();
      // .ilike means "case-insensitive like"
      // This says: Match title OR match creator
      query = query.or(`title.ilike.%${term}%,creator.ilike.%${term}%`);
    }

    // 2. Apply Type Filter
    if (currentFilters.kind !== 'all') query = query.eq('kind', currentFilters.kind);
    
    // 3. Apply Rating Filter
    if (currentFilters.rating !== 'all') query = query.gte('rating', parseInt(currentFilters.rating));

    // 4. Apply Sort
    if (currentFilters.sort === 'newest') query = query.order('event_date', { ascending: false });
    else if (currentFilters.sort === 'oldest') query = query.order('event_date', { ascending: true });
    else if (currentFilters.sort === 'highest') query = query.order('rating', { ascending: false });

    // 5. Execute
    const { data, count, error } = await query.range(from, to);
    
    if (error) {
      console.error('Error fetching:', error);
    } else {
      if (pageNumber === 0) {
        setEntries(data);
      } else {
        setEntries((prev) => [...prev, ...data]);
      }

      setTotalResults(count); 
      
      if ((pageNumber * PAGE_SIZE) + data.length >= count) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    }
  };

  // --- EFFECTS ---
  
  // On Login: Fetch everything
  useEffect(() => {
    if (session) {
      fetchEntries(0, filters);
      fetchStats(); // <--- Update stats on load
    }
  }, [session]);

  // On Filter Change: Reset list, keep stats same
  useEffect(() => {
    if (session) {
      setPage(0);
      setHasMore(true);
      fetchEntries(0, filters);
    }
  }, [filters]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);


  // --- CRUD WRAPPERS (Now updating Stats too) ---
  
  const addEntry = async (formData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in");

    const { error } = await supabase.from('entries').insert([{ user_id: user.id, ...formData, status: 'past' }]);

    if (error) alert(error.message);
    else {
      fetchEntries(0);
      fetchStats(); // <--- Refresh stats
      setShowForm(false);
    }
  };

  const updateEntry = async (id, formData) => {
    const { error } = await supabase.from('entries').update(formData).eq('id', id);
    if (error) alert(error.message);
    else {
      fetchEntries(0);
      fetchStats(); // <--- Refresh stats (in case category changed)
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
      fetchStats(); // <--- Refresh stats
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

  if (!session) return <Auth />;

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
        
        {/* Pass the separate "Stats Data" so it's always accurate */}
        <Stats entries={statsData} />

        <button 
          onClick={() => { setShowForm(!showForm); setEntryToEdit(null); }}
          style={{
            width: "100%", padding: "15px", backgroundColor: showForm ? "#eee" : "#222",
            color: showForm ? "#333" : "#fff", border: "none", borderRadius: "8px",
            fontSize: "16px", cursor: "pointer", marginBottom: "20px", fontWeight: "bold"
          }}
        >
          {showForm ? "Cancel" : "+ Log New Entry"}
        </button>
        
        {showForm && (
          <EntryForm 
            onAddEntry={addEntry} 
            onUpdateEntry={updateEntry}
            entryToEdit={entryToEdit}
            setEntryToEdit={setEntryToEdit}
          />
        )}
        
        <Filters filters={filters} setFilters={setFilters} />
        
        {/* --- NEW: Results Counter --- */}
        <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px", fontStyle: "italic" }}>
          {totalResults === 0 ? "No entries found." : `Showing ${entries.length} of ${totalResults} entries`}
        </div>

        <EntryList 
          entries={entries} 
          onDelete={deleteEntry} 
          onEdit={handleEditClick} 
        />

        {hasMore && (
          <button 
            onClick={loadMore}
            style={{
              display: "block", width: "100%", margin: "20px auto", padding: "12px",
              backgroundColor: "white", border: "1px solid #ccc", borderRadius: "8px",
              cursor: "pointer", color: "#555"
            }}
          >
            Load More ↓
          </button>
        )}
      </main>
    </div>
  );
}

export default App;