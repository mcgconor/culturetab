import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Greeting from './components/Greeting';
import EntryForm from './components/EntryForm';
import EntryList from './components/EntryList';

function App() {
  const [session, setSession] = useState(null);
  const [entries, setEntries] = useState([]);
  const [entryToEdit, setEntryToEdit] = useState(null); // <--- New State: Tracks what we are editing

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchEntries();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchEntries();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('event_date', { ascending: false });
    
    if (error) console.error('Error fetching:', error);
    else setEntries(data);
  };

  const addEntry = async (formData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in");

    const { error } = await supabase
      .from('entries')
      .insert([
        {
          user_id: user.id,
          title: formData.title,
          kind: formData.kind,
          event_date: formData.event_date,
          creator: formData.creator,         
          rating: formData.rating,           
          reflection: formData.reflection,   
          status: 'past'
        }
      ]);

    if (error) alert(error.message);
    else fetchEntries();
  };

  // --- NEW: UPDATE FUNCTION (UPDATE) ---
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
      .eq('id', id); // Must match the ID!

    if (error) {
      alert(error.message);
    } else {
      fetchEntries(); // Refresh the list
      // Note: The form handles resetting the state via the prop we pass down
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchEntries();
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
        
        {/* Pass all the props needed for editing */}
        <EntryForm 
          onAddEntry={addEntry} 
          onUpdateEntry={updateEntry}
          entryToEdit={entryToEdit}
          setEntryToEdit={setEntryToEdit}
        />
        
        {/* Pass the function to trigger edit mode */}
        <EntryList 
          entries={entries} 
          onDelete={deleteEntry} 
          onEdit={setEntryToEdit} // When clicked, this sets the state!
        />
      </main>
    </div>
  );
}

export default App;