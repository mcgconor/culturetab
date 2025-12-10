import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import StarRating from '../components/StarRating';
import EntryForm from '../components/EntryForm'; // <--- Import the form

// Re-using the color map
const typeColors = {
  book: "bg-blue-100 text-blue-700 border-blue-200",
  film: "bg-red-100 text-red-700 border-red-200",
  concert: "bg-purple-100 text-purple-700 border-purple-200",
  theatre: "bg-amber-100 text-amber-700 border-amber-200",
  exhibition: "bg-emerald-100 text-emerald-700 border-emerald-200",
  default: "bg-gray-100 text-gray-700 border-gray-200"
};

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // <--- State to toggle view

  useEffect(() => {
    fetchEntry();
  }, [id]);

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

  // --- DELETE LOGIC ---
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this entry? This cannot be undone.")) return;

    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      // Redirect back to home after deletion
      navigate('/', { replace: true });
    }
  };

  // --- UPDATE LOGIC ---
  const handleUpdate = async (id, formData) => {
    const { error } = await supabase.from('entries').update(formData).eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      await fetchEntry(); // Refresh local data
      setIsEditing(false); // Switch back to "View Mode"
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  if (!entry) return <div className="p-10 text-center">Entry not found.</div>;

  const badgeColor = typeColors[entry.kind] || typeColors.default;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      
      {/* Back Button */}
      <div className="max-w-3xl mx-auto mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
      </div>

      {/* CONDITIONAL RENDER: Edit Form OR View Card */}
      {isEditing ? (
        <div className="max-w-3xl mx-auto">
           {/* Reuse existing form, pass the current entry as "entryToEdit" */}
          <EntryForm 
            entryToEdit={entry} 
            onUpdateEntry={handleUpdate}
            // Detail page uses a different state variable (setIsEditing)
            onCancel={() => setIsEditing(false)} 
          />
        </div>
      ) : (
        <article className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* HEADER SECTION */}
          <div className="p-8 border-b border-gray-100 bg-white">
            
            {/* Top Row: Badge + Actions */}
            <div className="flex justify-between items-start mb-6">
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${badgeColor}`}>
                {entry.kind}
              </span>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-wider transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={handleDelete}
                  className="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-wider transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <h1 className="text-4xl font-black text-gray-900 leading-tight mb-2">
              {entry.title}
            </h1>
            
            {entry.creator && (
              <p className="text-xl text-gray-500 font-medium">
                by {entry.creator}
              </p>
            )}

            <div className="mt-6">
  <StarRating rating={entry.rating} />
</div>
          </div>

          {/* NOTES SECTION */}
          <div className="p-8 bg-gray-50/50 min-h-[300px]">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Personal Reflection
            </h3>
            {entry.reflection ? (
              <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-line font-serif">
                {entry.reflection}
              </p>
            ) : (
              <p className="text-gray-400 italic">No notes added.</p>
            )}
          </div>

        </article>
      )}

      {/* Footer Meta */}
      {!isEditing && (
        <div className="max-w-3xl mx-auto mt-6 text-center text-xs text-gray-400">
          Entry logged on {new Date(entry.created_at).toLocaleString()}
        </div>
      )}

    </div>
  );
}