import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function EntryDetail() {
  const { id } = useParams(); 
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) console.error(error);
      else setEntry(data);
      setLoading(false);
    };

    fetchEntry();
  }, [id]);

  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;
  if (!entry) return <div style={{ padding: "20px" }}>Entry not found.</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Link to="/" style={{ textDecoration: "none", color: "#666", fontSize: "14px" }}>← Back to Dashboard</Link>
      
      <div style={{ marginTop: "20px" }}>
        <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "12px", backgroundColor: "#eee" }}>
          {entry.kind.toUpperCase()}
        </span>
        
        <h1 style={{ marginTop: "10px", fontSize: "32px" }}>{entry.title}</h1>
        {entry.creator && <h3 style={{ color: "#555", marginTop: "-10px" }}>by {entry.creator}</h3>}
        
        <div style={{ margin: "20px 0", fontSize: "20px", color: "#f39c12" }}>
          {"★".repeat(entry.rating)}{"☆".repeat(5 - entry.rating)}
        </div>

        <div style={{ padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px", fontStyle: "italic", lineHeight: "1.6" }}>
          "{entry.reflection}"
        </div>

        <p style={{ color: "#999", fontSize: "12px", marginTop: "20px" }}>
          Logged on {new Date(entry.event_date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}