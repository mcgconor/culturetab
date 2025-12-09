function Stats({ entries }) {
  if (!entries || entries.length === 0) return null;

  // 1. Calculate the totals
  const total = entries.length;
  
  // A helper to count specific types
  const countType = (type) => entries.filter(e => e.kind === type).length;

  const books = countType('book');
  const films = countType('film');
  const other = total - (books + films); // Catch-all for concerts, theatre, etc.

  return (
    <div style={{ 
      display: "flex", 
      gap: "15px", 
      padding: "15px", 
      backgroundColor: "#fff", 
      borderRadius: "8px", 
      marginBottom: "20px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      fontSize: "14px",
      justifyContent: "space-around",
      alignItems: "center"
    }}>
      <div style={{ textAlign: "center" }}>
        <span style={{ display: "block", fontSize: "18px", fontWeight: "bold" }}>{total}</span>
        <span style={{ color: "#777" }}>Total Logged</span>
      </div>
      
      <div style={{ width: "1px", height: "30px", backgroundColor: "#eee" }}></div>

      <div style={{ textAlign: "center" }}>
        <span style={{ display: "block", fontSize: "18px", fontWeight: "bold" }}>📚 {books}</span>
        <span style={{ color: "#777" }}>Books</span>
      </div>

      <div style={{ textAlign: "center" }}>
        <span style={{ display: "block", fontSize: "18px", fontWeight: "bold" }}>🎬 {films}</span>
        <span style={{ color: "#777" }}>Films</span>
      </div>
      
      {other > 0 && (
        <>
           <div style={{ width: "1px", height: "30px", backgroundColor: "#eee" }}></div>
           <div style={{ textAlign: "center" }}>
            <span style={{ display: "block", fontSize: "18px", fontWeight: "bold" }}>🎨 {other}</span>
            <span style={{ color: "#777" }}>Other</span>
          </div>
        </>
      )}
    </div>
  );
}

export default Stats;