import { useState, useEffect } from 'react';

function EntryForm({ onAddEntry, onUpdateEntry, entryToEdit, setEntryToEdit }) {
  // Default Empty State
  const defaultState = {
    title: "",
    kind: "book",
    creator: "",
    rating: 3,
    reflection: "",
    event_date: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(defaultState);

  // MAGIC: Watch for "entryToEdit" changes. If it exists, fill the form!
  useEffect(() => {
    if (entryToEdit) {
      setFormData({
        title: entryToEdit.title,
        kind: entryToEdit.kind,
        creator: entryToEdit.creator || "", // Handle nulls safely
        rating: entryToEdit.rating || 3,
        reflection: entryToEdit.reflection || "",
        event_date: entryToEdit.event_date
      });
    } else {
      setFormData(defaultState);
    }
  }, [entryToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    if (entryToEdit) {
      // If we are editing, call the Update function
      onUpdateEntry(entryToEdit.id, formData);
    } else {
      // Otherwise, call the Add function
      onAddEntry(formData);
    }

    // Reset Form
    setFormData(defaultState);
    setEntryToEdit(null); // Exit edit mode
  };

  const handleCancel = () => {
    setFormData(defaultState);
    setEntryToEdit(null);
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "15px", 
      padding: "20px", 
      border: entryToEdit ? "2px solid #4a90e2" : "1px solid #eee", // Highlight when editing
      borderRadius: "8px",
      marginTop: "20px",
      backgroundColor: entryToEdit ? "#f0f7ff" : "#f9f9f9",
      transition: "all 0.3s ease"
    }}>
      
      {entryToEdit && <div style={{fontWeight: "bold", color: "#4a90e2"}}>✏️ Editing: {entryToEdit.title}</div>}

      <div style={{ display: "flex", gap: "10px" }}>
        <select 
          value={formData.kind}
          onChange={(e) => setFormData({...formData, kind: e.target.value})}
          style={{ padding: "10px", flex: 1 }}
        >
          <option value="book">Book</option>
          <option value="film">Film</option>
          <option value="theatre">Theatre</option>
          <option value="concert">Concert</option>
          <option value="exhibition">Exhibition</option>
          <option value="other">Other</option>
        </select>

        <input 
          type="date" 
          value={formData.event_date}
          onChange={(e) => setFormData({...formData, event_date: e.target.value})}
          style={{ padding: "10px" }}
          required
        />
      </div>

      <input 
        type="text" 
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        placeholder="Title"
        style={{ padding: "10px" }}
        required
      />

      <input 
        type="text" 
        value={formData.creator}
        onChange={(e) => setFormData({...formData, creator: e.target.value})}
        placeholder="Creator"
        style={{ padding: "10px" }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <label>Rating:</label>
        <select 
          value={formData.rating}
          onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
          style={{ padding: "10px" }}
        >
          <option value="1">1 Star</option>
          <option value="2">2 Stars</option>
          <option value="3">3 Stars</option>
          <option value="4">4 Stars</option>
          <option value="5">5 Stars</option>
        </select>
      </div>

      <textarea 
        value={formData.reflection}
        onChange={(e) => setFormData({...formData, reflection: e.target.value})}
        placeholder="Notes..."
        rows="3"
        style={{ padding: "10px", fontFamily: "inherit" }}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <button type="submit" style={{ flex: 1, padding: "12px", backgroundColor: "#222", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          {entryToEdit ? "Update Entry" : "Log Entry"}
        </button>
        
        {entryToEdit && (
          <button type="button" onClick={handleCancel} style={{ padding: "12px", backgroundColor: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default EntryForm;