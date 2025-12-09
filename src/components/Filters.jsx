import { useState } from 'react';

export default function Filters({ filters, setFilters }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({ kind: 'all', rating: 'all', sort: 'newest', search: '' });
    setIsSearchOpen(false);
  };

  // New: Handle the (X) click
  const clearSearch = () => {
    handleChange('search', ''); // Clear text
    setIsSearchOpen(false);     // Close bar
  };

  const isFiltered = filters.kind !== 'all' || filters.rating !== 'all' || filters.sort !== 'newest' || filters.search !== '';

  return (
    <div style={{ marginBottom: "20px" }}>
      
      {/* 1. THE SEARCH BAR (Now aligned perfectly) */}
      {isSearchOpen && (
        <div style={{ 
          marginBottom: "10px", 
          padding: "10px",              // Matches filter box padding
          backgroundColor: "#f9f9f9",   // Matches filter box color (optional, or keep white)
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <input 
            type="text"
            placeholder="Search title or creator..."
            value={filters.search || ""}
            onChange={(e) => handleChange('search', e.target.value)}
            autoFocus
            style={{
              flex: 1, // Takes up all available space
              padding: "10px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              outline: "none"
            }}
          />
          {/* The (X) Button */}
          <button 
            onClick={clearSearch}
            style={{
              background: "none",
              border: "none",
              color: "#999",
              fontSize: "18px",
              cursor: "pointer",
              padding: "0 5px"
            }}
            title="Clear & Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. THE FILTER ROW */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        flexWrap: "wrap",
        padding: "10px", // Updated to match search bar padding
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        alignItems: "center"
      }}>
        
        {/* Search Icon Toggle (Only show if search is closed) */}
        {!isSearchOpen && (
          <button 
            onClick={() => setIsSearchOpen(true)}
            style={{
              background: "none", border: "none", cursor: "pointer", fontSize: "16px",
              padding: "8px", borderRadius: "4px", backgroundColor: "#e0e0e0"
            }}
            title="Open Search"
          >
            🔍
          </button>
        )}

        {/* Dropdowns */}
        <select 
          value={filters.kind} 
          onChange={(e) => handleChange('kind', e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd", flex: 1, minWidth: "100px" }}
        >
          <option value="all">All Types</option>
          <option value="book">Books</option>
          <option value="film">Films</option>
          <option value="theatre">Theatre</option>
          <option value="concert">Concerts</option>
          <option value="exhibition">Exhibitions</option>
        </select>

        <select 
          value={filters.rating} 
          onChange={(e) => handleChange('rating', e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd", flex: 1, minWidth: "100px" }}
        >
          <option value="all">All Ratings</option>
          <option value="5">★★★★★ Only</option>
          <option value="4">★★★★ & Up</option>
          <option value="3">★★★ & Up</option>
        </select>

        <select 
          value={filters.sort} 
          onChange={(e) => handleChange('sort', e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd", flex: 1, minWidth: "120px" }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rated</option>
        </select>

        {/* Reset Button */}
        <button 
          onClick={handleReset}
          disabled={!isFiltered} 
          style={{
            padding: "8px 15px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: isFiltered ? "#222" : "#e0e0e0", 
            color: isFiltered ? "#fff" : "#999",
            cursor: isFiltered ? "pointer" : "default",
            fontSize: "14px",
            fontWeight: "bold",
            transition: "all 0.2s"
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}