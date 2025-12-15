import { Home, Calendar, Clock, Plus, LogOut } from 'lucide-react'; // Added LogOut if you want signout
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function TopNav({ onLogClick, session }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { id: 'home', icon: Home, label: 'Dash', path: '/' },
    { id: 'events', icon: Calendar, label: 'Events', path: '/events' },
    { id: 'history', icon: Clock, label: 'History', path: '/history' },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LEFT: Logo / Title */}
        <div 
            onClick={() => navigate('/')} 
            className="font-black text-xl tracking-tighter cursor-pointer flex items-center gap-2"
        >
            <span className="bg-black text-white px-2 py-0.5 rounded-md text-sm">C</span>
            <span className="hidden sm:inline">CultureTab</span>
        </div>

        {/* CENTER: Navigation Links */}
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
                        {/* On mobile, maybe hide text if space is tight, or keep it small */}
                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${active ? 'text-black' : 'text-gray-400'}`}>
                            {item.label}
                        </span>
                        
                        {/* Active Dot Indicator */}
                        {active && <span className="absolute bottom-1 w-1 h-1 bg-black rounded-full sm:hidden"></span>}
                    </button>
                );
            })}
        </nav>

        {/* RIGHT: Action Buttons */}
        <div className="flex items-center gap-3">
            {/* LOG BUTTON */}
            <button 
                onClick={onLogClick}
                className="bg-black text-white p-2 sm:px-4 sm:py-2 rounded-full sm:rounded-xl shadow-md hover:bg-gray-800 transition-transform active:scale-95 flex items-center gap-2"
                title="Log New Entry"
            >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Log</span>
            </button>
        </div>

      </div>
    </header>
  );
}