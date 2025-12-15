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
import EntryDetail from './pages/EntryDetail';
import Admin from './pages/Admin';
import TestCards from './pages/TestCards'; // <--- NEW IMPORT

const ADMIN_ROUTE_PATH = "/bobs";

export default function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // NEW: Specific flag to know when the DB check is totally finished
  const [adminCheckDone, setAdminCheckDone] = useState(false); 
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Check Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsReady(true); 
      
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        // No user = definitely not admin, and check is done
        setAdminCheckDone(true);
      }
    });

    // 2. Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsReady(true);
      if (session) {
        // Reset check status when user changes, then check again
        setAdminCheckDone(false); 
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
        setAdminCheckDone(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId) => {
    console.log("Checking admin status...");
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (data && data.is_admin) {
      console.log("Admin confirmed.");
      setIsAdmin(true);
    }
    // CRITICAL: Mark the check as finished, regardless of result
    setAdminCheckDone(true); 
  };

  if (!isReady) {
    return <div className="p-10 text-center text-gray-400">Initializing...</div>;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
        <Navbar session={session} isAdmin={isAdmin} /> 
        
        <main className="flex-grow">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event/:id" element={<PublicEventDetail />} />
            <Route path="/test-cards" element={<TestCards />} /> {/* <--- CLEAN ROUTE */}

            {/* AUTH ROUTES */}
            {!session ? (
              <Route path="*" element={<Auth />} />
            ) : (
              <>
                {/* ADMIN ROUTE - INTELLIGENT WAITING */}
                <Route 
                  path={ADMIN_ROUTE_PATH} 
                  element={
                    !adminCheckDone ? (
                      <div className="p-20 text-center text-gray-500">Verifying Permissions...</div>
                    ) : isAdmin ? (
                      <Admin session={session} isAdmin={isAdmin} /> 
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />

                {/* USER ROUTES */}
                <Route path="/" element={<Dashboard session={session} />} />
                <Route path="/history" element={<History />} />
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