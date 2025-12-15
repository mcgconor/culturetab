import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';     
import History from './pages/History';   
import EntryDetail from './pages/EntryDetail';
import PublicEventDetail from './pages/PublicEventDetail';

// DELETE THIS IMPORT:
// import Navbar from './components/Navbar'; 

export default function App() {
  const [session, setSession] = useState(null);

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
      
      {/* DELETE THE <Navbar /> COMPONENT HERE.
         The new TopNav is already inside Dashboard, Events, and History.
      */}

      <Routes>
        <Route path="/" element={<Dashboard session={session} />} />
        <Route path="/events" element={<Events session={session} />} />
        <Route path="/history" element={<History session={session} />} />
        <Route path="/entry/:id" element={<EntryDetail />} />
        <Route path="/event/:id" element={<PublicEventDetail session={session} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}