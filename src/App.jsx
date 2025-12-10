import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import History from './pages/History'; 
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Events from './pages/Events';
import PublicEventDetail from './pages/PublicEventDetail';
import EntryDetail from './pages/EntryDetail'; // <--- Imported exactly once

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading CultureTab...</div>;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
        <Navbar session={session} />
        
        <main className="flex-grow">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* PUBLIC EVENT CALENDAR (Ticketmaster/Supabase) */}
            <Route path="/events" element={<Events />} />
            <Route path="/event/:id" element={<PublicEventDetail />} />

            {/* AUTH ROUTES */}
            {!session ? (
              <Route path="*" element={<Auth />} />
            ) : (
              <>
                <Route path="/" element={<Dashboard session={session} />} />
                <Route path="/history" element={<History />} />
                
                {/* PRIVATE ENTRY DETAIL (Your Log) */}
                <Route path="/entry/:id" element={<EntryDetail />} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}