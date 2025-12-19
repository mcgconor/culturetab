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
import Settings from './pages/Settings'; 
import Admin from './pages/Admin'; 

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logTrigger, setLogTrigger] = useState(0);
  
  // REPLACE with your actual email
  const isAdmin = session?.user?.email === 'conormcgarry@gmail.com'; 

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
        
        {/* === PUBLIC ROUTES === */}
        {!session ? (
            <>
              <Route path="/" element={<Auth />} />
              <Route element={<PublicLayout />}>
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
              </Route>
              <Route path="/events" element={<Navigate to="/" state={{ openLogin: true }} replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
        ) : (
            <>
              {/* === PROTECTED APP ROUTES (Constrained Layout) === */}
              <Route element={<Layout session={session} onLogClick={() => setLogTrigger(t => t + 1)} />}>
                  <Route path="/" element={<Dashboard session={session} logTrigger={logTrigger} />} />
                  <Route path="/events" element={<Events session={session} logTrigger={logTrigger} />} />
                  <Route path="/history" element={<History session={session} logTrigger={logTrigger} />} />
                  
                  <Route path="/entry/:id" element={<EntryDetail />} />
                  <Route path="/event/:id" element={<PublicEventDetail session={session} logTrigger={logTrigger} />} />

                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/settings" element={<Settings session={session} />} />
              </Route>

              {/* === ADMIN ROUTE (Full Width / Independent Layout) === */}
              {/* We moved this OUTSIDE the Layout wrapper so it controls its own width */}
              <Route path="/bobs" element={<Admin isAdmin={isAdmin} />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
        )}
      </Routes>
    </Router>
  );
}