import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UniversalCard from './components/UniversalCard';

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
                      // 1. If we are still checking DB, show a loading text (don't redirect yet!)
                      <div className="p-20 text-center text-gray-500">Verifying Permissions...</div>
                    ) : isAdmin ? (
                      // 2. Check done + Is Admin = Show Dashboard
                      <Admin session={session} isAdmin={isAdmin} /> 
                    ) : (
                      // 3. Check done + Not Admin = Redirect
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

          {/* --- START OF NEW TEST ROUTE --- */}
             <Route path="/test-cards" element={
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-2xl mx-auto space-y-12">
      
      {/* SECTION 1: PUBLIC EVENT (Standard) */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
          1. Public Event (Standard)
        </h2>
        <UniversalCard 
          type="public" 
          item={{ 
            title: 'Gladiator II', 
            venue: 'IFI Cinema', 
            start_date: '2025-12-12T19:00:00', 
            category: 'Film', 
            image_url: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmf4redpa18NkE.jpg',
            external_url: 'https://ifi.ie'
          }} 
          onAction={() => alert("Logging...")}
        />
      </section>

      {/* SECTION 2: USER ENTRY (Logged) */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
          2. User Entry (Logged)
        </h2>
        <UniversalCard 
          type="entry" 
          item={{ 
            title: 'The National: 2024 Tour', 
            venue: '3Arena', 
            creator: 'The National (Band)',
            kind: 'concert', 
            rating: 5, 
            event_date: '2024-09-01',
            image_url: 'https://s1.ticketm.net/dam/a/c40/e0f51627-7734-4b9b-9040-d703d1685c40_1832961_TABLET_LANDSCAPE_LARGE_16_9.jpg'
          }} 
          onAction={() => alert("Edit")}
          onDelete={() => alert("Delete")}
        />
      </section>

      {/* SECTION 3: FALLBACK STATE (No Image) */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
          3. Fallback State (No Image / Date Block)
        </h2>
        <UniversalCard 
          type="public" 
          item={{ 
            title: 'Dublin International Film Festival 2025 Launch Night', 
            venue: 'Lighthouse Cinema', 
            start_date: '2025-02-20T18:30:00',
            category: 'Festival', 
            image_url: null 
          }} 
        />
      </section>
      
      {/* SECTION 4: SNIPPET WIDGET (Compact View) */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
          4. Snippet Widget (For Sidebars / Recents)
        </h2>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
           <h3 className="text-sm font-bold text-gray-700">Recent Activity</h3>
           {/* Snippet - Entry (Shows Rating) */}
           <UniversalCard 
             type="entry" 
             variant="snippet" 
             item={{ title: 'Sunday Roast at Home', venue: 'Mums House', rating: 4, kind: 'food', event_date: '2025-12-08' }} 
           />
           {/* Snippet - Public (Shows Date) */}
           <UniversalCard 
             type="public" 
             variant="snippet" 
             item={{ title: 'Experimental Jazz Night', venue: 'Grand Social', category: 'concert', start_date: '2025-01-15', image_url: 'https://via.placeholder.com/50' }} 
           />
        </div>
      </section>

    </div>
  </div>
} />
         {/* --- END OF NEW TEST ROUTE --- */}

          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}