function EntryList({ entries, onDelete, onEdit }) { // <--- Receive onEdit
  if (!entries || entries.length === 0) {
    return <p style={{ textAlign: "center", color: "#888", marginTop: "20px" }}>No entries yet. Log your first one!</p>;
  }

  return (
    <div style={{ marginTop: "30px" }}>
      <h3>My History</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {entries.map((entry) => (
          <div key={entry.id} style={{ 
            position: "relative",
            padding: "15px", 
            border: "1px solid #eee", 
            borderRadius: "8px", 
            backgroundColor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
          }}>
            
            <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "5px" }}>
              {/* EDIT BUTTON */}
              <button 
                onClick={() => onEdit(entry)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                title="Edit Entry"
              >
                ✏️
              </button>

              {/* DELETE BUTTON */}
              <button 
                onClick={() => onDelete(entry.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ff4444",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                title="Delete Entry"
              >
                🗑️
              </button>
            </div>

            {/* Content with Padding Fix */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "baseline",
              paddingRight: "60px" // <--- Breathing room for buttons
            }}>
              <h4 style={{ margin: "0 0 5px 0" }}>{entry.title}</h4>
              <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "#f0f0f0" }}>
                {entry.kind}
              </span>
            </div>
            
            {entry.creator && <div style={{ fontSize: "14px", color: "#555", marginBottom: "5px" }}>by {entry.creator}</div>}
            
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#777" }}>
              <span>{"★".repeat(entry.rating)}{"☆".repeat(5 - entry.rating)}</span>
              <span>•</span>
              <span>{new Date(entry.event_date).toLocaleDateString()}</span>
            </div>

            {entry.reflection && (
              <p style={{ marginTop: "10px", fontSize: "14px", fontStyle: "italic", color: "#444" }}>
                "{entry.reflection}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EntryList;