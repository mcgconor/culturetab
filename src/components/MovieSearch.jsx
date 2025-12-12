import { useState, useEffect } from 'react';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY; 

export default function MovieSearch({ initialTitle, onSelectMovie, onManualBypass }) {
  const [query, setQuery] = useState(initialTitle || '');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    setQuery(initialTitle || '');
  }, [initialTitle]);

  const fetchMovies = async (searchTerm) => {
    if (searchTerm.length < 3 || !TMDB_API_KEY) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      setSuggestions(data.results ? data.results.slice(0, 5) : []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    fetchMovies(val);
  };

  const handleSelect = (movie) => {
    const selection = {
      title: movie.title,
      creator: '', 
      image_url: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : ''
    };
    onSelectMovie(selection);
    setSuggestions([]);
  };

   const handleBypassClick = () => {
     onManualBypass(query);
   };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        // --- NEW: TRIGGER SEARCH ON FOCUS ---
        onFocus={() => { if (query.length >= 3) fetchMovies(query); }}
        placeholder="Search for a film..."
        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 appearance-none"
        autoFocus
      />
      
      {suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((movie) => {
            const thumb = movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : null;
            const year = movie.release_date ? movie.release_date.split('-')[0] : '';
            return (
              <div 
                key={movie.id} 
                onClick={() => handleSelect(movie)}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none"
              >
                {thumb ? (
                   <img src={thumb} alt="poster" className="w-8 h-12 object-cover rounded shadow-sm" />
                ) : (
                   <div className="w-8 h-12 bg-gray-100 rounded flex items-center justify-center text-xs">🎬</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{movie.title}</p>
                  <p className="text-xs text-gray-500">{year}</p>
                </div>
              </div>
            );
          })}

          <div 
            onClick={handleBypassClick}
            className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer text-center border-t border-gray-200"
          >
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
               (X) Title Not Found - Enter Manually
             </span>
          </div>

        </div>
      )}
    </div>
  );
}