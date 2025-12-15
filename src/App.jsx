import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Layout from './components/Layout'; // <--- Import the new Layout
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';     
import History from './pages/History';   
import EntryDetail from './pages/EntryDetail';
import PublicEventDetail from './pages/PublicEventDetail';

export default function App() {
  const [session, setSession] = useState(null);
  
  // This state allows the Layout header to trigger the Modal in the pages
  const [logTrigger, setLogTrigger] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  return (
    <Router>
      <Routes>
        {/* WRAP THE MAIN TABS IN THE LAYOUT */}
        <Route element={<Layout session={session} onLogClick={() => setLogTrigger(t => t + 1)} />}>
            <Route path="/" element={<Dashboard session={session} logTrigger={logTrigger} />} />
            <Route path="/events" element={<Events session={session} logTrigger={logTrigger} />} />
            <Route path="/history" element={<History session={session} logTrigger={logTrigger} />} />
        </Route>

        {/* STANDALONE PAGES (No Main Nav) */}
        <Route path="/entry/:id" element={<EntryDetail />} />
        <Route path="/event/:id" element={<PublicEventDetail session={session} />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}