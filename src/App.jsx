import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Components
import Navbar from './components/Navbar'; // <--- Newly created
import Footer from './components/Footer'; // <--- Newly created
import Auth from './components/Auth';

// Pages
import Dashboard from './pages/Dashboard';     
import EntryDetail from './pages/EntryDetail'; 
import History from './pages/History'; 

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      {/* LAYOUT WRAPPER:
         min-h-screen: Forces app to be at least as tall as the window
         flex-col: Stacks Nav, Content, Footer vertically
      */}
      <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
        
        {/* 1. TOP NAVIGATION */}
        <Navbar session={session} />
        
        {/* 2. MAIN CONTENT (Grows to fill space) */}
        <div className="flex-grow">
          {!session ? (
            <Auth />
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard session={session} />} />
              <Route path="/history" element={<History session={session} />} /> 
              <Route path="/entry/:id" element={<EntryDetail />} />
            </Routes>
          )}
        </div>

        {/* 3. FOOTER (Pushed to bottom) */}
        <Footer />
        
      </div>
    </Router>
  );
}

export default App;