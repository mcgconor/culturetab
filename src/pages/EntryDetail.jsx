import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
    if(id) fetchEntry();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Delete this entry?')) {
      await supabase.from('entries').delete().eq('id', id);
      navigate('/');
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading...</div>;
  if (!entry) return <div className="p-12 text-center">Entry not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 animate-fade-in">
      
      {/* NAV */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="text-sm font-bold text-gray-400 hover:text-black">
          ← Back
        </button>
        <div className="flex gap-4">
          <button onClick={() => navigate('/', { state: { editEntry: entry } })} className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider">
            Edit
          </button>
          <button onClick={handleDelete} className="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-wider">
            Delete
          </button>
        </div>
      </div>

      <article className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* HEADER / COVER */}
        <div className="flex flex-col md:flex-row">
          {entry.image_url && (
            <div className="md:w-1/3 h-64 md:h-auto relative bg-gray-100">
               <img src={entry.image_url} alt={entry.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="p-8 flex-grow">
             <div className="flex justify-between items-start mb-2">
                <span className="inline-block px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-4">
                  {entry.kind}
                </span>
                {/* RATING */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${i < entry.rating ? 'text-black' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
             </div>

             <h1 className="text-3xl font-black text-gray-900 mb-2 leading-tight">{entry.title}</h1>
             <p className="text-lg text-gray-500 font-bold mb-6">{entry.creator}</p>
             
             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
               Experienced on {new Date(entry.event_date).toLocaleDateString()}
             </div>
          </div>
        </div>

        {/* REFLECTION BODY */}
        {entry.reflection && (
          <div className="p-8 border-t border-gray-50">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">My Notes</h3>
            <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
              {entry.reflection}
            </div>
          </div>
        )}

      </article>
    </div>
  );
}