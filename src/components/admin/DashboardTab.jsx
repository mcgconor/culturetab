import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function DashboardTab() {
  const [stats, setStats] = useState({ users: 0, entries: 0, events: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Entries (SIMPLE FETCH - No Joins)
        const { count: entriesCount, data: entriesData, error: entriesError } = await supabase
          .from('entries')
          .select('*', { count: 'exact' });

        if (entriesError) console.error("Entries Error:", entriesError);

        // 2. Extract User IDs to fetch Emails
        const userIds = entriesData ? [...new Set(entriesData.map(e => e.user_id))] : [];

        // 3. Fetch Profiles manually (Bulletproof method)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        // 4. Create a map for easy lookup: { 'user_id': 'email@test.com' }
        const emailMap = {};
        if (profilesData) {
          profilesData.forEach(p => { emailMap[p.id] = p.email; });
        }

        // 5. Fetch Events Count
        const { count: eventsCount } = await supabase
          .from('public_events')
          .select('*', { count: 'exact', head: true });

        // 6. Set Stats
        setStats({ 
          users: userIds.length, 
          entries: entriesCount || 0, 
          events: eventsCount || 0 
        });

        // 7. Sort and Merge Emails into Logs
        if (entriesData) {
            const sorted = entriesData.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
            const top20 = sorted.slice(0, 20).map(log => ({
              ...log,
              user_email: emailMap[log.user_id] || 'Unknown User' // <--- Map email here
            }));
            setRecentLogs(top20);
        }

      } catch (err) {
        console.error("Dashboard Crash:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading Dashboard Data...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black text-gray-900 mb-6">Dashboard Overview</h1>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total User Logs</h3>
          <p className="text-4xl font-black text-gray-900 mt-2">{stats.entries}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scraped Events</h3>
          <p className="text-4xl font-black text-gray-900 mt-2">{stats.events}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Users</h3>
          <p className="text-4xl font-black text-gray-900 mt-2">{stats.users}</p>
        </div>
      </div>

      {/* LIVE FEED */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900">Live User Activity Feed</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-bold">User</th>
              <th className="px-6 py-3 font-bold">Entry</th>
              <th className="px-6 py-3 font-bold">Type</th>
              <th className="px-6 py-3 font-bold">Rating</th>
              <th className="px-6 py-3 font-bold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-indigo-600 font-medium">
                  {log.user_email} 
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{log.title}</div>
                  <div className="text-xs text-gray-500">{log.creator}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold uppercase bg-gray-100 px-2 py-1 rounded text-gray-600">{log.kind}</span>
                </td>
                <td className="px-6 py-4 font-bold">
                    {log.rating > 0 ? `${log.rating} ★` : '-'}
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(log.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}