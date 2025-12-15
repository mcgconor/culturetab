import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Layout from './components/Layout'; 
import PublicLayout from './components/PublicLayout'; 
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';     
import History from './pages/History';   
import EntryDetail from './pages/EntryDetail';
import PublicEventDetail from './pages/PublicEventDetail';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [logTrigger, setLogTrigger] = useState(0);

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

  if (loading) return null;

  return (
    <Router>
      <Routes>
        
        {/* === PUBLIC ROUTES (Logged Out) === */}
        {!session ? (
            <>
              {/* Home Page */}
              <Route path="/" element={<Auth />} />
              
              {/* Secondary Pages (Wrapped in PublicLayout so they get Header/Footer) */}
              <Route element={<PublicLayout />}>
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
              </Route>

              {/* FIX: Redirect /events to Home, but tell Home to OPEN THE LOGIN MODAL */}
              <Route path="/events" element={<Navigate to="/" state={{ openLogin: true }} replace />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
        ) : (
            <>
              {/* === PROTECTED ROUTES (Logged In) === */}
              <Route element={<Layout session={session} onLogClick={() => setLogTrigger(t => t + 1)} />}>
                  <Route path="/" element={<Dashboard session={session} logTrigger={logTrigger} />} />
                  <Route path="/events" element={<Events session={session} logTrigger={logTrigger} />} />
                  <Route path="/history" element={<History session={session} logTrigger={logTrigger} />} />
                  
                  {/* Reuse same pages for logged-in users */}
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
              </Route>

              {/* STANDALONE PROTECTED PAGES */}
              <Route path="/entry/:id" element={<EntryDetail />} />
              <Route path="/event/:id" element={<PublicEventDetail session={session} />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
        )}
      </Routes>
    </Router>
  );
}