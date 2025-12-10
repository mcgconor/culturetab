import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';     
import EntryDetail from './pages/EntryDetail'; 
import History from './pages/History'; // <--- Import the new page

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) return <Auth />;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard session={session} />} />
        <Route path="/history" element={<History session={session} />} /> 
        <Route path="/entry/:id" element={<EntryDetail />} />
      </Routes>
    </Router>
  );
}

export default App;