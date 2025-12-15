import { Link } from 'react-router-dom';

export default function PublicNav({ onSignInClick }) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO: Now a Link to Home */}
        <Link 
            to="/" 
            className="font-black text-xl tracking-tighter text-gray-900 select-none hover:opacity-80 transition-opacity"
        >
            CultureTab.
        </Link>

        {/* RIGHT SIDE: Navigation */}
        <div className="flex items-center gap-6">
            <Link 
                to="/contact" 
                className="text-sm font-bold text-gray-500 hover:text-black transition-colors hidden sm:block"
            >
                Contact
            </Link>
            
            <button 
                onClick={onSignInClick}
                className="text-sm font-bold text-black hover:text-gray-600 transition-colors"
            >
                Sign In
            </button>
        </div>

      </div>
    </header>
  );
}