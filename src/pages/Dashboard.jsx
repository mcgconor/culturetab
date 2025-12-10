import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Greeting from '../components/Greeting';
import EntryForm from '../components/EntryForm';
import EntryList from '../components/EntryList';
import Stats from '../components/Stats';

export default function Dashboard({ session }) {
  // DATA STATES
  const [recentEntries, setRecentEntries] = useState([]);      
  const [statsData, setStatsData] = useState([]);   

  // UI STATES
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // 1. Fetch Stats
  const fetchStats = useCallback(async () => {
    const { data, error } = await supabase.from('entries').select('kind'); 
    if (!error) setStatsData(data);
  }, []);

  // 2. Fetch ONLY Recent 3 Entries (Simple fetch, no filters)
  const fetchRecent = useCallback(async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(3); // <--- Only grab the top 3
    
    if (!error) setRecentEntries(data);
  }, []);

  // Initial Load
  useEffect(() => {
    fetchRecent();
    fetchStats(); 
  }, [fetchRecent, fetchStats]);

  const addEntry = async (formData) => {
    const { error } = await supabase.from('entries').insert([{ user_id: session.user.id, ...formData, status: 'past' }]);
    if (error) alert(error.message);
    else {
      fetchRecent(); // Refresh recent list
      fetchStats();
      setShowForm(false);
    }
  };

  const updateEntry = async (id, formData) => {
    const { error } = await supabase.from('entries').update(formData).eq('id', id);
    if (error) alert(error.message);
    else {
      fetchRecent();
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
      fetchRecent();
      fetchStats();
    }
  };

  const handleEditClick = (entry) => {
    setEntryToEdit(entry);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

        {/* LOG BUTTON */}
        <button 
          onClick={() => { setShowForm(!showForm); setEntryToEdit(null); }}
          style={{ width: "100%", padding: "15px", backgroundColor: showForm ? "#eee" : "#222", color: showForm ? "#333" : "#fff", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer", marginBottom: "20px", fontWeight: "bold" }}
        >
          {showForm ? "Cancel" : "+ Log New Entry"}
        </button>
        
        {showForm && (
          <EntryForm onAddEntry={addEntry} onUpdateEntry={updateEntry} entryToEdit={entryToEdit} setEntryToEdit={setEntryToEdit} />
        )}
        
        {/* RECENT ACTIVITY */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", marginBottom: "15px" }}>
          <h3 style={{ margin: 0 }}>Recent Activity</h3>
          <Link to="/history" style={{ color: "#007bff", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>
            View All →
          </Link>
        </div>

        <EntryList entries={recentEntries} onDelete={deleteEntry} onEdit={handleEditClick} />

        {/* Big Navigation Button */}
        <Link to="/history" style={{ textDecoration: "none" }}>
          <button style={{ 
            display: "block", width: "100%", margin: "20px auto", padding: "15px", 
            backgroundColor: "white", border: "2px solid #eee", borderRadius: "8px", 
            cursor: "pointer", color: "#222", fontWeight: "bold", fontSize: "16px"
          }}>
            📂 Browse Full History
          </button>
        </Link>

      </main>
    </div>
  );
}