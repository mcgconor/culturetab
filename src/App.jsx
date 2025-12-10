import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';     // <--- The Dashboard we just made
import EntryDetail from './pages/EntryDetail'; // <--- The Detail Page we made earlier

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // 1. If no session, show Login
  if (!session) return <Auth />;

  // 2. If logged in, show the Router
  return (
    <Router>
      <Routes>
        {/* Route 1: The Home Page (Dashboard) */}
        <Route path="/" element={<Dashboard session={session} />} />
        
        {/* Route 2: The Detail Page (e.g. /entry/123) */}
        <Route path="/entry/:id" element={<EntryDetail />} />
      </Routes>
    </Router>
  );
}

export default App;