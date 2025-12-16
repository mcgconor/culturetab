import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import EntryForm from '../components/EntryForm'; 
import { Plus } from 'lucide-react'; 

// --- HELPER: Upgrade Image Quality ---
function getHighResImageUrl(url) {
  if (!url) return null;
  if (url.includes('tmdb.org')) return url.replace(/\/w\d+\//, '/original/'); 
  if (url.includes('books.google.com')) return url.replace('&zoom=1', '&zoom=3'); 
  return url;
}

// --- HELPER: Smart Date Label ---
function getDateLabel(kind) {
    if (!kind) return 'Logged on';
    const cat = kind.toLowerCase();
    if (cat === 'book') return 'Read on';
    if (cat === 'film' || cat === 'movie') return 'Watched on';
    if (cat === 'exhibition' || cat === 'museum' || cat === 'gallery') return 'Visited on';
    if (cat === 'concert' || cat === 'theatre' || cat === 'gig') return 'Attended on';
    return 'Logged on'; 
}

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);

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
    if(id) fetchEntry();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Delete this entry?')) {
      await supabase.from('entries').delete().eq('id', id);
      navigate('/');
    }
  };

  const handleUpdateEntry = async (entryId, formData) => {
    try {
        const { error } = await supabase
            .from('entries')
            .update(formData)
            .eq('id', entryId);

        if (error) throw error;
        setEntry(prev => ({ ...prev, ...formData }));
        setShowEntryForm(false);
    } catch (error) {
        console.error('Error updating entry:', error);
        alert('Error updating entry.');
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading...</div>;
  if (!entry) return <div className="p-12 text-center">Entry not found</div>;

  const highResImage = getHighResImageUrl(entry.image_url);

  return (
    // FIX: Removed 'bg-gray-50'
    <div className="min-h-screen py-12 px-4 animate-fade-in relative">
      
      {/* NAV */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="text-sm font-bold text-gray-400 hover:text-black">
          ← Back
        </button>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowEntryForm(true)} 
            className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider"
          >
            Edit
          </button>
          <button onClick={handleDelete} className="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-wider">
            Delete
          </button>
        </div>
      </div>

      <article className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* 1. THE STAGE (Image Area) */}
        {highResImage && (
            <div className="w-full bg-gray-100 relative overflow-hidden flex justify-center items-center py-8 px-4">
               
               {/* OPTIONAL: Blurred Background for atmosphere */}
               <div 
                 className="absolute inset-0 opacity-30 blur-2xl scale-110"
                 style={{ backgroundImage: `url(${highResImage})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
               />
               
               {/* MAIN IMAGE */}
               {/* max-h-[60vh] ensures it doesn't become too tall on desktop */}
               <img 
                 src={highResImage} 
                 alt={entry.title} 
                 className="relative z-10 max-h-[500px] w-auto max-w-full shadow-lg rounded-lg" 
               />
            </div>
        )}

        {/* 2. CONTENT AREA (Full Width Below Image) */}
        <div className="p-8 md:p-12">
             
             {/* Header Metadata */}
             <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-600">
                  {entry.kind}
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-base ${i < entry.rating ? 'text-black' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
             </div>

             {/* Title & Creator */}
             <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 leading-tight">
                {entry.title}
             </h1>
             <p className="text-xl text-gray-500 font-bold mb-8">
                {entry.creator}
             </p>
             
             {/* Date */}
             <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest mb-10 pb-10 border-b border-gray-100">
               <span>{getDateLabel(entry.kind)} {new Date(entry.event_date).toLocaleDateString()}</span>
             </div>

             {/* Reflection / Notes */}
             {entry.reflection && (
                <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        My Notes
                    </h3>
                    <div className="prose prose-lg prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {entry.reflection}
                    </div>
                </div>
             )}
        </div>

      </article>

      {/* MODAL OVERLAY */}
      {showEntryForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl relative">
                <button 
                  onClick={() => setShowEntryForm(false)}
                  className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"
                >
                  <Plus className="w-5 h-5 transform rotate-45 text-gray-500" />
                </button>

                <EntryForm 
                    entryToEdit={entry} 
                    onUpdateEntry={handleUpdateEntry} 
                    onCancel={() => setShowEntryForm(false)}
                    onAddEntry={() => {}} 
                />
            </div>
        </div>
      )}

    </div>
  );
}