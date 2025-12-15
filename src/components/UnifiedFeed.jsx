import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import UniversalCard from './UniversalCard';
import { useNavigate } from 'react-router-dom';

// FIX: Added 'onLogPublic' to props so we can talk to the Dashboard
export default function UnifiedFeed({ session: propSession, onEdit, onLogPublic }) {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let userId = propSession?.user?.id;
    if (userId) {
        fetchMixedFeed(userId);
    } else {
        supabase.auth.getSession().then(({ data }) => {
            if (data?.session?.user) {
                fetchMixedFeed(data.session.user.id);
            } else {
                setLoading(false); 
            }
        });
    }
  }, [propSession]);

  async function fetchMixedFeed(userId) {
    setLoading(true);
    
    // 1. Public Events
    const now = new Date().toISOString();
    const { data: publicEvents } = await supabase
      .from('public_events')
      .select('*')
      .gt('start_date', now)
      .order('start_date', { ascending: true })
      .limit(5);

    // 2. User Entries
    const { data: userEntries } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: false })
      .limit(5);

    // 3. Normalize
    const normalizedPublic = (publicEvents || []).map(e => ({
      ...e, type: 'public', sortDate: new Date(e.start_date).getTime() 
    }));

    const normalizedEntries = (userEntries || []).map(e => ({
      ...e, type: 'entry', sortDate: new Date(e.event_date).getTime()
    }));

    setFeedItems([...normalizedPublic, ...normalizedEntries]);
    setLoading(false);
  }

  // --- HANDLERS ---
  
  // 1. Edit User Entry (Passes back to Dashboard)
  const handleEditEntry = (item) => {
    if (onEdit) {
        onEdit(item); 
    } else {
        navigate(`/entry/${item.id}`);
    }
  };

  // 2. Log Public Event (Passes back to Dashboard)
  const handleLogPublic = (item) => {
    if (onLogPublic) {
        onLogPublic(item); // <--- This opens the modal on Dashboard
    } else {
        // Fallback (e.g. if used on a page without the modal)
        navigate(`/event/${item.id}`);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Delete this memory?")) return;
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (!error) setFeedItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return (
    <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>)}
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      
      {/* SECTION 1: UPCOMING (Public) */}
      <div>
        <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-gray-900">Upcoming in Dublin</h2>
            <button 
                onClick={() => navigate('/events')} 
                className="text-sm font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-1"
            >
                View All →
            </button>
        </div>

        <div className="space-y-4">
            {feedItems.filter(i => i.type === 'public').length === 0 ? (
                <p className="text-sm text-gray-400">No upcoming events found.</p>
            ) : (
                feedItems.filter(i => i.type === 'public').map(item => (
                    <UniversalCard 
                        key={`pub-${item.id}`} 
                        item={item} 
                        type="public" 
                        onAction={handleLogPublic} // <--- WIRED UP HERE
                    />
                ))
            )}
        </div>
      </div>

      {/* SECTION 2: RECENT ACTIVITY (User) */}
      <div>
        <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Recent Activity</h2>
            <button 
                onClick={() => navigate('/history')} 
                className="text-sm font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-1"
            >
                View All →
            </button>
        </div>

        <div className="space-y-4">
            {feedItems.filter(i => i.type === 'entry').length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-gray-500 font-medium">You haven't logged anything yet.</p>
                </div>
            ) : (
                feedItems.filter(i => i.type === 'entry').map(item => (
                    <UniversalCard 
                        key={`ent-${item.id}`} 
                        item={item} 
                        type="entry" 
                        onAction={handleEditEntry} 
                        onDelete={handleDeleteEntry}
                    />
                ))
            )}
        </div>
      </div>
    </div>
  );
}