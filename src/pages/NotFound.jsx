import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-black text-gray-100 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h2>
      <p className="text-gray-500 mb-8">Sorry, we couldn't find the page you're looking for.</p>
      
      <Link to="/" className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors">
        Go back home
      </Link>
    </div>
  );
}