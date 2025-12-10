import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar({ session }) {
  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="text-xl font-black tracking-tighter text-gray-900 hover:opacity-80 transition-opacity">
          CultureTab
        </Link>

        {/* RIGHT SIDE LINKS */}
        <div className="flex items-center gap-6 text-sm font-bold">
          {session ? (
            <>
              {/* Desktop/Tablet Links */}
              <Link to="/" className="text-gray-500 hover:text-black transition-colors hidden sm:block">
                Dashboard
              </Link>
              <Link to="/history" className="text-gray-500 hover:text-black transition-colors">
                History
              </Link>
              
              <div className="h-4 w-px bg-gray-200 hidden sm:block"></div> {/* Divider */}

              <button 
                onClick={() => supabase.auth.signOut()} 
                className="text-red-500 hover:text-red-700 uppercase tracking-wider text-xs"
              >
                Sign Out
              </button>
            </>
          ) : (
            <span className="text-gray-400 font-normal">Welcome</span>
          )}
        </div>
      </div>
    </nav>
  );
}