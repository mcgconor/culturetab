import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import EntryForm from '../components/EntryForm';
import EntryList from '../components/EntryList';
import Stats from '../components/Stats';
import DublinEvents from '../components/DublinEvents';

export default function Dashboard({ session }) {
  const [entries, setEntries] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);
  
  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // 1. DATA FETCHING
  const fetchRecent = useCallback(async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('event_date', { ascending: false }) 
      .limit(5);

    if (error) console.error('Error fetching recent:', error);
    else setEntries(data);
  }, []);

  const fetchStats = useCallback(async () => {
    const { data, error } = await supabase.from('entries').select('*');
    if (!error) setStatsData(data);
  }, []);

  // 2. GHOST ENTRY HANDLING
  useEffect(() => {
    const processPendingEntry = async () => {
      const pendingStr = localStorage.getItem('pendingEntry');
      if (pendingStr && session?.user) {
        try {
          const pendingData = JSON.parse(pendingStr);
          const { error } = await supabase.from('entries').insert([{
            user_id: session.user.id,
            ...pendingData,
            status: 'past'
          }]);
          if (!error) { fetchRecent(); fetchStats(); }
        } catch (err) { console.error(err); } 
        finally { localStorage.removeItem('pendingEntry'); }
      }
    };
    processPendingEntry();
  }, [session, fetchRecent, fetchStats]);

  useEffect(() => { 
    fetchRecent(); 
    fetchStats(); 
  }, [fetchRecent, fetchStats]);

  // 3. ACTION HANDLERS
  const handleAddEntry = async (formData) => {
    const { error } = await supabase.from('entries').insert([
      { user_id: session.user.id, ...formData, status: 'past' }
    ]);
    if (error) alert(error.message);
    else { setShowForm(false); fetchRecent(); fetchStats(); }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (!error) { fetchRecent(); fetchStats(); }
  };

  const handleUpdate = async (id, formData) => {
    const { error } = await supabase.from('entries').update(formData).eq('id', id);
    if (!error) { setEntryToEdit(null); setShowForm(false); fetchRecent(); fetchStats(); }
  };

  const startEdit = (entry) => {
    setEntryToEdit(entry);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in">
      
      {/* SECTION A: HEADER & ACTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Welcome back, {firstName}.
          </h1>
          <p className="text-gray-500 text-lg max-w-md leading-relaxed">
            Ready to log your latest culture fix? Track your books, films, and art here.
          </p>
        </div>

        {!showForm && (
          <button 
            onClick={() => { setEntryToEdit(null); setShowForm(true); }}
            className="flex-shrink-0 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98]"
          >
            + Log New Entry
          </button>
        )}
      </div>

      {/* FORM OVERLAY (If Open) */}
      {showForm && (
        <div className="mb-12">
          <EntryForm 
            onAddEntry={handleAddEntry}
            onUpdateEntry={handleUpdate}
            entryToEdit={entryToEdit}
            onCancel={() => { setShowForm(false); setEntryToEdit(null); }}
          />
        </div>
      )}

      {/* SECTION B: STATS */}
      <div className="mb-12">
         <Stats entries={statsData} />
      </div>

      {/* SECTION C: UPCOMING EVENTS (New Filtered Widget) */}
      <DublinEvents />

      {/* SECTION D: RECENT ACTIVITY */}
      <div>
        <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
          <h2 className="text-xl font-bold text-gray-900">Your Recent Activity</h2>
          {entries.length > 0 && (
             <a href="/history" className="text-sm font-bold text-gray-400 hover:text-black transition-colors">
               View All →
             </a>
          )}
        </div>

        {entries.length === 0 && !showForm ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No entries yet. Start logging!</p>
          </div>
        ) : (
          <EntryList entries={entries} onDelete={handleDelete} onEdit={startEdit} />
        )}
      </div>
    </div>
  );
}