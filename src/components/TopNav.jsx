import { useState, useRef, useEffect } from 'react';
import { Home, Calendar, Clock, Plus, LogOut, User, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Added Link
import { supabase } from '../supabaseClient';

export default function TopNav({ onLogClick, session }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Dash', path: '/' },
    { id: 'events', icon: Calendar, label: 'Events', path: '/events' },
    { id: 'history', icon: Clock, label: 'History', path: '/history' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO: Link to Dashboard */}
        <Link 
            to="/" 
            className="font-black text-xl tracking-tighter text-gray-900 select-none hover:opacity-80 transition-opacity"
        >
            CultureTab.
        </Link>

        {/* CENTER: Main Navigation */}
        <nav className="flex items-center gap-1 sm:gap-6">
            {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`
                            relative px-3 py-2 rounded-lg flex flex-col sm:flex-row items-center gap-1.5 transition-all
                            ${active ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
                        `}
                    >
                        <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${active ? 'text-black' : 'text-gray-400'}`}>
                            {item.label}
                        </span>
                        {active && <span className="absolute bottom-1 w-1 h-1 bg-black rounded-full sm:hidden"></span>}
                    </button>
                );
            })}
        </nav>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
            
            {/* LOG BUTTON */}
            <button 
                onClick={onLogClick}
                className="bg-black text-white p-2 sm:px-4 sm:py-2 rounded-full sm:rounded-xl shadow-md hover:bg-gray-800 transition-transform active:scale-95 flex items-center gap-2"
            >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Log</span>
            </button>

            {/* USER MENU DROPDOWN */}
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-2 rounded-full transition-colors border border-transparent ${isMenuOpen ? 'bg-gray-100 border-gray-200' : 'hover:bg-gray-100'}`}
                >
                    <User className="w-5 h-5 text-gray-700" />
                </button>

                {/* THE DROPDOWN */}
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 animate-fade-in origin-top-right overflow-hidden">
                        
                        <div className="px-3 py-2 border-b border-gray-50 mb-1">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Signed in as</p>
                            <p className="text-sm font-bold text-gray-900 truncate">{session?.user?.email}</p>
                        </div>

                        <button onClick={() => navigate('/contact')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">
                            <Mail className="w-4 h-4" /> Contact Support
                        </button>
                        
                        <div className="h-px bg-gray-100 my-1"></div>

                        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                )}
            </div>

        </div>

      </div>
    </header>
  );
}