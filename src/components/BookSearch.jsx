import { useState, useEffect } from 'react';

export default function BookSearch({ initialTitle, onSelectBook, onManualBypass }) {
  const [query, setQuery] = useState(initialTitle || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(initialTitle || '');
  }, [initialTitle]);

  const fetchBooks = async (searchTerm) => {
    if (searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      // Request 20 results to give us a better chance of finding 5 unique titles
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=20`); 
      const data = await res.json();
      
      const rawItems = data.items || [];
      const uniqueTitles = new Set();
      const uniqueSuggestions = [];

      // DEDUPLICATION LOGIC: 
      for (const item of rawItems) {
        const title = item.volumeInfo?.title;
        // Skip items without a title or if the title is already collected
        if (title && !uniqueTitles.has(title)) {
          uniqueTitles.add(title);
          uniqueSuggestions.push(item);
        }
        // Stop once we have our desired number of unique suggestions (5)
        if (uniqueSuggestions.length >= 5) {
          break;
        }
      }
      
      setSuggestions(uniqueSuggestions);
      
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    fetchBooks(val);
  };

  const handleSelect = (book) => {
    const info = book.volumeInfo;
    const selection = {
      title: info.title,
      creator: info.authors ? info.authors.join(', ') : '',
      image_url: info.imageLinks?.thumbnail || ''
    };
    onSelectBook(selection);
    setSuggestions([]); // Clear suggestions on select
  };

  const handleBypassClick = () => {
    // Pass current query back up to form and close this component
    onManualBypass(query);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        // Focus to restart search if component is remounted (i.e., manual mode was exited)
        onFocus={() => { if (query.length >= 3) fetchBooks(query); }}
        placeholder="Search for a book..."
        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 appearance-none"
        autoFocus
      />
      
      {suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((book) => {
            const info = book.volumeInfo;
            const thumb = info.imageLinks?.smallThumbnail;
            return (
              <div 
                key={book.id} 
                onClick={() => handleSelect(book)}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none"
              >
                {thumb ? (
                   <img src={thumb} alt="cover" className="w-8 h-12 object-cover rounded shadow-sm" />
                ) : (
                   <div className="w-8 h-12 bg-gray-100 rounded flex items-center justify-center text-xs">📖</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{info.title}</p>
                  <p className="text-xs text-gray-500 truncate">{info.authors?.join(', ')}</p>
                </div>
              </div>
            );
          })}
          
          {/* --- MANUAL ENTRY BYPASS BUTTON --- */}
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