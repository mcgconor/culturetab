import { useState, useEffect } from 'react';

// **PASTE YOUR GOOGLE API KEY HERE**
const GOOGLE_BOOKS_KEY = 'AIzaSyAl-aPcpqmbawaYQurLCjK_SvSGTRPDfVY';

export default function BookSearch({ initialTitle = '', onSelectBook }) {
  const [query, setQuery] = useState(initialTitle);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- THE FIX: Sync input when data loads ---
  useEffect(() => {
    setQuery(initialTitle);
  }, [initialTitle]);
  // ------------------------------------------

  const searchBooks = async (searchQuery) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&key=${'AIzaSyAl-aPcpqmbawaYQurLCjK_SvSGTRPDfVY'}&maxResults=5`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      setResults(data.items || []); 
    } catch (error) {
      console.error('Google Books Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (book) => {
    const info = book.volumeInfo;

    const selection = {
      title: info.title,
      creator: info.authors ? info.authors.join(', ') : 'Unknown Author',
      // Force https for images
      image_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '', 
      event_date: info.publishedDate || ''
    };
    
    onSelectBook(selection);
    setResults([]);
    setQuery(info.title);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search for book title..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          searchBooks(e.target.value);
        }}
        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all duration-200"
      />
      
      {loading && <div className="absolute top-0 right-0 p-3 text-gray-500 text-xs">Searching...</div>}

      {results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
          {results.map((book) => {
            const info = book.volumeInfo;
            const thumb = info.imageLinks?.thumbnail;

            return (
              <div 
                key={book.id} 
                onClick={() => handleSelect(book)}
                className="flex items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
              >
                {thumb ? (
                  <img 
                    src={thumb.replace('http:', 'https:')} 
                    alt={info.title} 
                    className="w-10 h-14 object-cover rounded mr-3 flex-shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-14 bg-gray-200 rounded mr-3 flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                    ?
                  </div>
                )}
                
                <div className="text-sm overflow-hidden">
                  <p className="font-medium text-gray-900 leading-tight truncate">{info.title}</p>
                  <p className="text-gray-500 text-xs truncate">
                    {info.authors ? info.authors[0] : 'Unknown'} 
                    {info.publishedDate && ` (${info.publishedDate.substring(0,4)})`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}