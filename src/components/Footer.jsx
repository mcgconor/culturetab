import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="text-center md:text-left">
            <h3 className="font-black text-lg tracking-tighter text-gray-900 mb-1">CultureTab.</h3>
            <p className="text-xs text-gray-400 font-medium">
              © {currentYear} CultureTab. All rights reserved.
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
            <Link to="/" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
              Home
            </Link>
            
            {/* If logged out: Router redirects /events -> / (Home)
               If logged in: Router allows /events
            */}
            <Link to="/events" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
              Events
            </Link>
            
            <Link to="/contact" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
              Contact
            </Link>
            <Link to="/privacy" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}