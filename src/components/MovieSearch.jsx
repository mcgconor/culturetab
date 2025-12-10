import { useState } from 'react';

// TMDB requires a specific base URL for images
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w92'; 

// **IMPORTANT: PASTE YOUR KEY HERE**
const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhYmZjZGNiNWNmZjUxYzZmODYxNGMzODA1NGMyZWJiMyIsIm5iZiI6MTc2NTM2MTQxOC44NjA5OTk4LCJzdWIiOiI2OTM5NDcwYTgwMGZjOWFhNGI3ZmNiZWQiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Ry5tZzlOlCAg9PbFXhwZp7RLESZWkjjiIcz5LNMN8s0'; 

export default function MovieSearch({ initialTitle = '', onSelectMovie }) {
  const [query, setQuery] = useState(initialTitle);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchMovies = async (searchQuery) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);

    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(searchQuery)}&include_adult=false&language=en-US&page=1`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TMDB_API_KEY}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('TMDB API Error');
      }

      const data = await response.json();
      setResults(data.results.slice(0, 5)); // Show top 5 results
    } catch (error) {
      console.error('TMDB Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (movie) => {
    // 1. Fetch the director (TMDB requires a second call for credits)
    const director = await fetchDirector(movie.id);

    // 2. Format the data for the main form
    const selection = {
      title: movie.title,
      creator: director || 'N/A', // Update the Creator field
      image_url: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : '', // Update the Image URL field
      event_date: movie.release_date || ''
    };
    
    onSelectMovie(selection); // Send the data back to the main form
    setResults([]); // Clear results list
    setQuery(movie.title); // Update the input field to the selected title
  };

  const fetchDirector = async (movieId) => {
    const creditsUrl = `https://api.themoviedb.org/3/movie/${movieId}/credits?language=en-US`;
    try {
      const response = await fetch(creditsUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${TMDB_API_KEY}` }
      });
      const data = await response.json();
      
      const director = data.crew.find(member => member.job === 'Director');
      return director ? director.name : null;

    } catch (error) {
      console.error('Failed to fetch director:', error);
      return null;
    }
  };


  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search for a film title..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          searchMovies(e.target.value);
        }}
        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all duration-200"
      />
      
      {loading && <div className="absolute top-0 right-0 p-3 text-gray-500">Searching...</div>}

      {results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
          {results.map((movie) => (
            <div 
              key={movie.id} 
              onClick={() => handleSelect(movie)}
              className="flex items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
            >
              {movie.poster_path && (
                <img 
                  src={`${IMAGE_BASE_URL}${movie.poster_path}`} 
                  alt={movie.title} 
                  className="w-10 h-14 object-cover rounded mr-3 flex-shrink-0"
                />
              )}
              <div className="text-sm">
                <p className="font-medium text-gray-900 leading-tight">{movie.title}</p>
                <p className="text-gray-500 text-xs">
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : 'No date'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}