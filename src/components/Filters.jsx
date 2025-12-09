export default function Filters({ filters, setFilters }) {
  
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({ kind: 'all', rating: 'all', sort: 'newest' });
  };

  // Check if any filter is active so we can highlight the reset button
  const isFiltered = filters.kind !== 'all' || filters.rating !== 'all' || filters.sort !== 'newest';

  return (
    <div style={{ 
      display: "flex", 
      gap: "10px", 
      marginBottom: "20px", 
      flexWrap: "wrap",
      padding: "15px",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
      alignItems: "center"
    }}>
      {/* Type Filter */}
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

      {/* Rating Filter */}
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

      {/* Sort Order */}
      <select 
        value={filters.sort} 
        onChange={(e) => handleChange('sort', e.target.value)}
        style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ddd", flex: 1, minWidth: "120px" }}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="highest">Highest Rated</option>
      </select>

      {/* RESET BUTTON */}
      <button 
        onClick={handleReset}
        disabled={!isFiltered} // Disable if nothing is changed
        style={{
          padding: "8px 15px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          backgroundColor: isFiltered ? "#222" : "#e0e0e0", // Dark when active, gray when disabled
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
  );
}