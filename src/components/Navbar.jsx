import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar({ session }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 h-16 flex justify-between items-center">
        
        {/* LOGO - Updated Branding */}
        <Link to="/" className="text-xl font-black tracking-tighter text-gray-900">
          CultureTab.
        </Link>

        {/* MENU - Consistent Fonts */}
        {session && (
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className="text-sm font-bold text-gray-500 hover:text-black transition-colors"
            >
              Dashboard
            </Link>
            
            <Link 
              to="/history" 
              className="text-sm font-bold text-gray-500 hover:text-black transition-colors"
            >
              History
            </Link>
            
            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-gray-500 hover:text-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}