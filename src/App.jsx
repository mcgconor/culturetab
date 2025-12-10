import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // <--- Added Navigate
import { supabase } from './supabaseClient';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Auth from './components/Auth';

// Pages
import Dashboard from './pages/Dashboard';     
import EntryDetail from './pages/EntryDetail'; 
import History from './pages/History';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // <--- Add loading state to prevent flash

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

  if (loading) return null; // Prevent flickering while checking session

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
        
        <Navbar session={session} />
        
        <div className="flex-grow">
          <Routes>
            {/* PUBLIC PAGES (Accessible by everyone) */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />

            {/* THE SPLIT HOME PAGE */}
            {/* If logged in -> Dashboard. If logged out -> Auth Landing Page */}
            <Route path="/" element={!session ? <Auth /> : <Dashboard session={session} />} />

            {/* PROTECTED PAGES (Only if logged in, otherwise bounce to Home) */}
            <Route 
              path="/history" 
              element={session ? <History session={session} /> : <Navigate to="/" />} 
            /> 
            <Route 
              path="/entry/:id" 
              element={session ? <EntryDetail /> : <Navigate to="/" />} 
            />
            {/* CATCH ALL (Must be at the very bottom) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        <Footer />
        
      </div>
    </Router>
  );
}

export default App;