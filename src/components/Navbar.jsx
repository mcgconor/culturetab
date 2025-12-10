import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar({ session }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu

  const handleLogout = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 h-16 flex justify-between items-center relative">
        
        {/* LOGO */}
        <Link to="/" className="text-xl font-black tracking-tighter text-gray-900 z-50 relative">
          CultureTab.
        </Link>

        {session && (
          <>
            {/* DESKTOP MENU (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
                Dashboard
              </Link>
              <Link to="/history" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
                History
              </Link>
              <button onClick={handleLogout} className="text-sm font-bold text-gray-500 hover:text-red-600 transition-colors">
                Sign Out
              </button>
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden z-50 p-2 -mr-2 text-gray-900 focus:outline-none"
            >
              {/* Animated Hamburger Icon */}
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`h-0.5 w-full bg-black rounded-full transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`h-0.5 w-full bg-black rounded-full transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 w-full bg-black rounded-full transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
              </div>
            </button>

            {/* MOBILE MENU DROPDOWN */}
            {isOpen && (
              <div className="absolute top-0 left-0 w-full bg-white border-b border-gray-100 shadow-xl py-20 px-6 flex flex-col gap-6 md:hidden animate-fade-in">
                <Link 
                  to="/" 
                  onClick={() => setIsOpen(false)}
                  className="text-2xl font-black text-gray-900 tracking-tight"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/history" 
                  onClick={() => setIsOpen(false)}
                  className="text-2xl font-black text-gray-900 tracking-tight"
                >
                  History
                </Link>
                <div className="h-px bg-gray-100 my-2"></div>
                <button 
                  onClick={handleLogout}
                  className="text-left text-xl font-bold text-red-600"
                >
                  Sign Out
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}