import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Greeting from './components/Greeting';
import EntryForm from './components/EntryForm';
import EntryList from './components/EntryList';
import Stats from './components/Stats';

function App() {
  const [session, setSession] = useState(null);
  const [entries, setEntries] = useState([]);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // --- 1. DEFINE THIS FUNCTION FIRST ---
  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('event_date', { ascending: false });
    
    if (error) console.error('Error fetching:', error);
    else setEntries(data);
  };

  // --- 2. NOW USE IT IN USEEFFECT ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchEntries();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchEntries();
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 3. REST OF YOUR FUNCTIONS ---
  const addEntry = async (formData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in");

    const { error } = await supabase
      .from('entries')
      .insert([{
          user_id: user.id,
          title: formData.title,
          kind: formData.kind,
          event_date: formData.event_date,
          creator: formData.creator,         
          rating: formData.rating,           
          reflection: formData.reflection,   
          status: 'past'
      }]);

    if (error) {
      alert(error.message);
    } else {
      fetchEntries();
      setShowForm(false);
    }
  };

  const updateEntry = async (id, formData) => {
    const { error } = await supabase
      .from('entries')
      .update({
        title: formData.title,
        kind: formData.kind,
        event_date: formData.event_date,
        creator: formData.creator,
        rating: formData.rating,
        reflection: formData.reflection
      })
      .eq('id', id);

    if (error) {
      alert(error.message);
    } else {
      fetchEntries();
      setShowForm(false);
      setEntryToEdit(null);
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchEntries();
  };

  const handleEditClick = (entry) => {
    setEntryToEdit(entry);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        
        {/* Make sure to uncomment this now that the file exists! */}
        <Stats entries={entries} />

        <button 
          onClick={() => {
            setShowForm(!showForm);
            setEntryToEdit(null);
          }}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: showForm ? "#eee" : "#222",
            color: showForm ? "#333" : "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "20px",
            fontWeight: "bold",
            transition: "all 0.2s"
          }}
        >
          {showForm ? "Cancel / Close Form" : "+ Log New Entry"}
        </button>
        
        {showForm && (
          <EntryForm 
            onAddEntry={addEntry} 
            onUpdateEntry={updateEntry}
            entryToEdit={entryToEdit}
            setEntryToEdit={setEntryToEdit}
          />
        )}
        
        <EntryList 
          entries={entries} 
          onDelete={deleteEntry} 
          onEdit={handleEditClick} 
        />
      </main>
    </div>
  );
}

export default App;