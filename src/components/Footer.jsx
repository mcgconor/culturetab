import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-12 mt-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 text-center">
        
        {/* LOGO */}
        <div className="mb-6">
          <span className="font-black text-xl tracking-tighter">CultureTab.</span>
        </div>

        {/* LINKS */}
        <div className="flex justify-center gap-6 mb-8 text-sm font-bold text-gray-500">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <Link to="/events" className="hover:text-black transition-colors">Events</Link> {/* <--- NEW */}
          <Link to="/contact" className="hover:text-black transition-colors">Contact</Link>
          <Link to="/privacy" className="hover:text-black transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-black transition-colors">Terms</Link>
        </div>

        {/* COPYRIGHT */}
        <div className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} CultureTab. All rights reserved.
        </div>
        
      </div>
    </footer>
  );
}