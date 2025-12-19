import { useState } from 'react';
import { Search, Calendar, Star, X } from 'lucide-react';

export default function Filters({ filters, setFilters, showRating = false, resultCount = 0 }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'film', label: 'Film' },
    { id: 'book', label: 'Book' },
    { id: 'concert', label: 'Music' },
    { id: 'theatre', label: 'Theatre' },
    { id: 'exhibition', label: 'Art' },
  ];

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ kind: 'all', rating: 'all', date: '', search: '' });
    setIsSearchOpen(false);
  };

  const hasActiveFilters = 
    filters.search !== '' || 
    filters.kind !== 'all' || 
    filters.date !== '' || 
    (showRating && filters.rating !== 'all');

  return (
    <div className="mb-8 space-y-4">
      
      {/* ROW 1: SEARCH + CATEGORY LOZENGES */}
      <div className="flex items-center gap-4">
        
        {/* EXPANDING SEARCH (Original Logic) */}
        <div className={`relative transition-all duration-300 ${isSearchOpen ? 'w-full md:w-64' : 'w-10'}`}>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center cursor-pointer z-10"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className={`w-5 h-5 ${isSearchOpen ? 'text-black' : 'text-gray-400 hover:text-black'}`} />
          </div>
          
          <input 
            type="text" 
            placeholder="Search title..." 
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className={`
              h-10 bg-gray-50 border border-gray-200 rounded-full pl-10 pr-4 text-sm font-medium outline-none focus:border-black focus:ring-1 focus:ring-black transition-all duration-300
              ${isSearchOpen ? 'w-full opacity-100' : 'w-0 opacity-0 pointer-events-none border-transparent'}
            `}
          />
        </div>

        {/* CATEGORY LOZENGES */}
        <div className="flex-1 overflow-x-auto no-scrollbar mask-gradient-right">
          <div className="flex gap-2">
            {categories.map((cat) => {
              const isActive = filters.kind === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleChange('kind', cat.id)}
                  className={`
                    whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                    ${isActive 
                      ? 'bg-black text-white shadow-md transform scale-105' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black'
                    }
                  `}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 2: FILTERS & RESULT COUNT */}
      <div className="flex flex-wrap items-center justify-between gap-3 pl-1">
        
        {/* LEFT: Inputs */}
        <div className="flex flex-wrap items-center gap-3">
            {/* DATE PICKER */}
            <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                <input 
                    type="date" 
                    value={filters.date || ''}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="pl-9 pr-3 h-9 bg-white border border-gray-200 rounded-lg text-xs font-bold uppercase text-gray-600 outline-none focus:border-black transition-colors cursor-pointer"
                />
            </div>

            {/* RATING */}
            {showRating && (
                <div className="relative group">
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                    <select 
                    value={filters.rating} 
                    onChange={(e) => handleChange('rating', e.target.value)}
                    className="pl-9 pr-8 h-9 bg-white border border-gray-200 rounded-lg text-xs font-bold uppercase text-gray-600 outline-none focus:border-black transition-colors appearance-none cursor-pointer"
                    >
                    <option value="all">Any Rating</option>
                    <option value="5">5 Stars Only</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    </select>
                </div>
            )}

            {/* CLEAR BUTTON */}
            {hasActiveFilters && (
                <button 
                    onClick={clearFilters}
                    className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                    <X className="w-3 h-3" /> Clear
                </button>
            )}
        </div>

        {/* RIGHT: RESULTS COUNTER (Added) */}
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {resultCount} {resultCount === 1 ? 'Result' : 'Results'}
        </div>

      </div>
    </div>
  );
}