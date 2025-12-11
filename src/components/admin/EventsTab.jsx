import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import ScraperDocs from './events/ScraperDocs';

// --- SUB-COMPONENT: SCRAPES DASHBOARD ---
function ScrapesView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase.from('scraper_logs').select('*').order('run_at', { ascending: false });
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="p-4 text-gray-400">Loading Logs...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 border border-gray-200 rounded-xl">
           <h3 className="text-xs font-bold text-gray-400 uppercase">Total Runs</h3>
           <p className="text-3xl font-black text-gray-900 mt-2">{logs.length}</p>
        </div>
        <div className="bg-white p-6 border border-gray-200 rounded-xl">
           <h3 className="text-xs font-bold text-gray-400 uppercase">Last Sync</h3>
           <p className="text-lg font-bold text-gray-900 mt-2">
             {logs[0] ? new Date(logs[0].run_at).toLocaleString() : 'Never'}
           </p>
        </div>
        <div className="bg-white p-6 border border-gray-200 rounded-xl">
           <h3 className="text-xs font-bold text-gray-400 uppercase">Total Fetched</h3>
           <p className="text-3xl font-black text-indigo-600 mt-2">
             {logs.reduce((sum, log) => sum + (log.items_fetched || 0), 0)}
           </p>
        </div>
      </div>
      
      {/* LOGS TABLE */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-bold">
            <tr>
              <th className="px-6 py-3">Scraper Name</th>
              <th className="px-6 py-3">Run Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Fetched</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{log.scraper_name}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(log.run_at).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold">{log.items_fetched}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: EVENT TYPES STATS ---
function EventTypesView({ events }) {
  const stats = useMemo(() => {
    const distinctTypes = [...new Set([...events.map(e => e.category || 'unknown'), 'concert', 'theatre', 'exhibition', 'film'])];
    const now = new Date();
    const matrix = {};

    distinctTypes.forEach(type => {
      const typeEvents = events.filter(e => (e.category || 'unknown') === type);
      const past = typeEvents.filter(e => new Date(e.start_date) < now).length;
      const future = typeEvents.filter(e => new Date(e.start_date) >= now);
      const today = future.filter(e => {
        const d = new Date(e.start_date);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
      }).length;
      const next7 = future.filter(e => {
        const d = new Date(e.start_date);
        const diff = (d - now) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }).length;
      const next30 = future.filter(e => {
        const d = new Date(e.start_date);
        const diff = (d - now) / (1000 * 60 * 60 * 24);
        return diff <= 30;
      }).length;

      if (typeEvents.length > 0) {
        matrix[type] = { total: typeEvents.length, past, today, next7, next30 };
      }
    });
    return matrix;
  }, [events]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 font-bold">
          <tr>
            <th className="px-6 py-4">Event Type</th>
            <th className="px-6 py-4 text-center bg-blue-50 text-blue-800">Today</th>
            <th className="px-6 py-4 text-center">Next 7 Days</th>
            <th className="px-6 py-4 text-center">Next 30 Days</th>
            <th className="px-6 py-4 text-center text-gray-400">Past</th>
            <th className="px-6 py-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Object.entries(stats).map(([type, data]) => (
            <tr key={type} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-bold uppercase text-gray-700">{type}</td>
              <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/30">{data.today}</td>
              <td className="px-6 py-4 text-center font-medium">{data.next7}</td>
              <td className="px-6 py-4 text-center font-medium">{data.next30}</td>
              <td className="px-6 py-4 text-center text-gray-400">{data.past}</td>
              <td className="px-6 py-4 text-right font-black">{data.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- SUB-COMPONENT: VENUES MERGE TOOL (UPDATED) ---
function VenuesView({ events, onRefresh }) {
  const [selected, setSelected] = useState([]);
  const [targetName, setTargetName] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  // 1. Get unique venues and sort them A-Z
  const venues = useMemo(() => {
    const v = events.map(e => e.venue).filter(Boolean);
    return [...new Set(v)].sort();
  }, [events]);

  // 2. Handle Checkbox Toggle
  const toggleVenue = (venue) => {
    if (selected.includes(venue)) {
      setSelected(selected.filter(v => v !== venue));
    } else {
      setSelected([...selected, venue]);
      // If it's the first selection, auto-fill the target name
      if (selected.length === 0) setTargetName(venue); 
    }
  };

  // 3. Handle Merge Action
  const handleMerge = async () => {
    if (!targetName) return alert("Please enter a Target Master Name.");
    if (selected.length === 0) return alert("Please select venues to merge.");
    if (!window.confirm(`Merge ${selected.length} venues into "${targetName}"? This will update all related events.`)) return;

    setIsMerging(true);
    
    // Call our SQL function
    const { error } = await supabase.rpc('merge_venues', {
      target_name: targetName,
      old_names: selected
    });

    if (error) {
      alert("Error merging: " + error.message);
    } else {
      alert("Success! Venues merged.");
      setSelected([]);
      setTargetName('');
      onRefresh(); // Reload data to show changes
    }
    setIsMerging(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 animate-fade-in relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-900 text-lg">Venue Cleanup ({venues.length})</h3>
        <button onClick={() => window.print()} className="text-xs font-bold text-blue-600 hover:underline">Print List</button>
      </div>

      {/* STICKY MERGE BAR (Visible when items selected) */}
      {selected.length > 0 && (
        <div className="sticky top-0 z-10 bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-end animate-fade-in">
          <div className="w-full">
            <label className="block text-xs font-bold uppercase text-indigo-800 mb-1">
              Merge {selected.length} selected into Master Name:
            </label>
            <input 
              type="text" 
              value={targetName} 
              onChange={(e) => setTargetName(e.target.value)}
              className="w-full px-3 py-2 border border-indigo-200 rounded bg-white text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. The Grand Social"
            />
          </div>
          <button 
            onClick={handleMerge}
            disabled={isMerging}
            className="w-full md:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-sm text-sm transition-colors disabled:opacity-50"
          >
            {isMerging ? 'Merging...' : 'Merge Venues'}
          </button>
          <button 
            onClick={() => setSelected([])}
            className="text-xs text-gray-500 underline self-center md:self-end pb-2 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      )}

      {/* VENUE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {venues.map((venue, i) => {
          const isSelected = selected.includes(venue);
          return (
            <div 
              key={i} 
              onClick={() => toggleVenue(venue)}
              className={`
                p-3 rounded border text-sm cursor-pointer transition-all select-none flex items-center gap-3
                ${isSelected 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-[1.02]' 
                  : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100 hover:border-gray-300'}
              `}
            >
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center bg-white ${isSelected ? 'border-transparent' : 'border-gray-300'}`}>
                {isSelected && <div className="w-2 h-2 bg-indigo-600 rounded-sm" />}
              </div>
              <span className="truncate">{venue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: EVENTS LIST ---
function EventsListView({ events, onDelete }) {
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [showPast, setShowPast] = useState(false);

  const sources = [...new Set(events.map(e => e.scraper_source).filter(Boolean))];

  const filtered = events.filter(e => {
    const matchesSearch = 
      (e.title || '').toLowerCase().includes(search.toLowerCase()) || 
      (e.venue || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesSource = filterSource ? e.scraper_source === filterSource : true;

    const eventDate = e.start_date ? new Date(e.start_date) : null;
    const isFuture = eventDate ? eventDate >= new Date().setHours(0,0,0,0) : false;
    const matchesTime = showPast ? true : isFuture;

    return matchesSearch && matchesSource && matchesTime;
  });

  return (
    <div className="animate-fade-in">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow w-full">
          <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Search</label>
          <input 
            type="text" 
            placeholder="Search title or venue..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="w-full md:w-48">
           <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Source Scraper</label>
           <select 
              value={filterSource} 
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer"
           >
             <option value="">All Sources</option>
             {sources.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>

        <div className="pb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                    type="checkbox" 
                    checked={showPast}
                    onChange={(e) => setShowPast(e.target.checked)}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <span className="text-sm font-bold text-gray-700">Show Past Events</span>
            </label>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-bold">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Event</th>
              <th className="px-6 py-3">Venue</th>
              <th className="px-6 py-3">Source</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(event => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                   {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'No Date'}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                   {event.title}
                   {event.external_url && (
                     <a href={event.external_url} target="_blank" rel="noreferrer" className="block text-[10px] text-blue-500 hover:underline mt-1">
                       View Link
                     </a>
                   )}
                </td>
                <td className="px-6 py-4 text-gray-600">{event.venue}</td>
                <td className="px-6 py-4 text-xs font-mono text-gray-500">
                    <span className={`px-2 py-1 rounded-full ${event.scraper_source ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-500'}`}>
                        {event.scraper_source || 'Unknown'}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => onDelete(event.id)} className="text-red-600 font-bold text-xs bg-red-50 hover:bg-red-100 px-3 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
             {filtered.length === 0 && (
               <tr><td colSpan="5" className="p-8 text-center text-gray-400">No events found matching your filters.</td></tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function EventsTab() {
  const [activeSubTab, setActiveSubTab] = useState('events'); 
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from('public_events').select('*');
      if (error) throw error;
      const sorted = (data || []).sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date) : new Date(8640000000000000);
        const dateB = b.start_date ? new Date(b.start_date) : new Date(8640000000000000);
        return dateA - dateB;
      });
      setEvents(sorted);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    const { error } = await supabase.from('public_events').delete().eq('id', id);
    if (!error) setEvents(events.filter(e => e.id !== id));
  };

  const SUB_TABS = [
    { id: 'scrapes', label: 'Run Logs' },
    { id: 'scrapers', label: 'Scraper Docs' },
    { id: 'types', label: 'Stats' },
    { id: 'events', label: 'All Events' },
    { id: 'venues', label: 'Cleanup Venues' }, // Renamed to indicate action
  ];

  if (loading) return <div className="p-6 text-gray-400">Loading Events Data...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Event Management</h2>
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit overflow-x-auto">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all whitespace-nowrap ${
              activeSubTab === tab.id 
                ? 'bg-white text-black shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'scrapes' && <ScrapesView />}
      {activeSubTab === 'scrapers' && <ScraperDocs />} 
      {activeSubTab === 'types' && <EventTypesView events={events} />}
      {activeSubTab === 'events' && <EventsListView events={events} onDelete={handleDelete} />}
      {/* Pass onRefresh so the list updates after a merge */}
      {activeSubTab === 'venues' && <VenuesView events={events} onRefresh={fetchEvents} />}
    </div>
  );
}