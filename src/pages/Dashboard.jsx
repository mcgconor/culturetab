import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Greeting from '../components/Greeting';
import EntryForm from '../components/EntryForm';
import EntryList from '../components/EntryList';
import Stats from '../components/Stats';

export default function Dashboard({ session }) {
  const [recentEntries, setRecentEntries] = useState([]);      
  const [statsData, setStatsData] = useState([]);   
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchStats = useCallback(async () => {
    const { data, error } = await supabase.from('entries').select('kind'); 
    if (!error) setStatsData(data);
  }, []);

  const fetchRecent = useCallback(async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false }) // showing recently logged
      .limit(3); 
    
    if (!error) setRecentEntries(data);
  }, []);

  useEffect(() => {
    fetchRecent();
    fetchStats(); 
  }, [fetchRecent, fetchStats]);

  const addEntry = async (formData) => {
    const { error } = await supabase.from('entries').insert([{ user_id: session.user.id, ...formData, status: 'past' }]);
    if (error) alert(error.message);
    else {
      fetchRecent();
      fetchStats();
      setShowForm(false);
    }
  };

  const updateEntry = async (id, formData) => {
    const { error } = await supabase.from('entries').update(formData).eq('id', id);
    if (error) alert(error.message);
    else {
      fetchRecent();
      fetchStats();
      setShowForm(false);
      setEntryToEdit(null);
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) alert(error.message);
    else {
      fetchRecent();
      fetchStats();
    }
  };

  const handleEditClick = (entry) => {
    setEntryToEdit(entry);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      
      <main>
        <Greeting session={session} />
        <Stats entries={statsData} />

        {/* LOG BUTTON: Only show if form is CLOSED */}
        {!showForm && (
          <button 
            onClick={() => { setShowForm(true); setEntryToEdit(null); }}
            className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-md hover:bg-gray-800 transition-all active:scale-[0.98] mb-8"
          >
            + Log New Entry
          </button>
        )}
        
        {/* FORM */}
        {showForm && (
          <EntryForm 
            onAddEntry={addEntry} 
            onUpdateEntry={updateEntry} 
            entryToEdit={entryToEdit} 
            // When user clicks cancel inside form, we close it here
            onCancel={() => { setShowForm(false); setEntryToEdit(null); }} 
          />
        )}
        
        {/* RECENT ACTIVITY */}
        <div className="flex justify-between items-center mt-8 mb-4">
          <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
          <Link to="/history" className="text-blue-600 font-bold text-sm hover:underline">
            View All →
          </Link>
        </div>

        <EntryList entries={recentEntries} onDelete={deleteEntry} onEdit={handleEditClick} />

        <Link to="/history">
          <button className="w-full mt-8 py-4 bg-white border border-gray-200 text-gray-900 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors">
            📂 Browse Full History
          </button>
        </Link>

      </main>
    </div>
  );
}