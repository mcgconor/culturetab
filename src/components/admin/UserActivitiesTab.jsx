import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function UserActivitiesTab() {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      // 1. Fetch All Entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      // 2. Extract User IDs
      const userIds = [...new Set(entriesData.map(e => e.user_id))];

      // 3. Fetch Emails Manually (Bulletproof)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      // 4. Map IDs to Emails
      const emailMap = {};
      if (profilesData) {
        profilesData.forEach(p => { emailMap[p.id] = p.email; });
      }

      // 5. Merge Data
      const fullData = entriesData.map(entry => ({
        ...entry,
        user_email: emailMap[entry.user_id] || 'Unknown User'
      }));

      setActivities(fullData);
      setFilteredActivities(fullData);

    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // FILTERING LOGIC
  useEffect(() => {
    let result = activities;

    // 1. Search (Title, Creator, or User Email)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.creator?.toLowerCase().includes(q) ||
        item.user_email?.toLowerCase().includes(q)
      );
    }

    // 2. Type Filter
    if (typeFilter) {
      result = result.filter(item => item.kind === typeFilter);
    }

    // 3. Rating Filter
    if (ratingFilter) {
      result = result.filter(item => item.rating === parseInt(ratingFilter));
    }

    // 4. Sorting
    result = [...result].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle Dates
      if (sortConfig.key === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      // Handle Strings
      else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue ? bValue.toLowerCase() : '';
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredActivities(result);
  }, [search, typeFilter, ratingFilter, sortConfig, activities]);

  // Handle Sort Click
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleReset = () => {
    setSearch('');
    setTypeFilter('');
    setRatingFilter('');
    setSortConfig({ key: 'created_at', direction: 'desc' });
  };

  if (loading) return <div className="p-6 text-gray-500">Loading Activity Log...</div>;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900">Global Activity Log</h2>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
          {filteredActivities.length} Entries Found
        </span>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow w-full">
          <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Search</label>
          <input 
            type="text" 
            placeholder="Search title, user, or creator..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="w-full md:w-40">
           <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Type</label>
           <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer"
           >
             <option value="">All Types</option>
             <option value="book">Book</option>
             <option value="film">Film</option>
             <option value="concert">Concert</option>
             <option value="theatre">Theatre</option>
             <option value="exhibition">Exhibition</option>
           </select>
        </div>

        <div className="w-full md:w-40">
           <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Rating</label>
           <select 
              value={ratingFilter} 
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer"
           >
             <option value="">Any Rating</option>
             <option value="5">5 Stars</option>
             <option value="4">4 Stars</option>
             <option value="3">3 Stars</option>
             <option value="2">2 Stars</option>
             <option value="1">1 Star</option>
           </select>
        </div>

        <button 
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors w-full md:w-auto"
        >
          Reset
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th onClick={() => handleSort('user_email')} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                User <span className="ml-1">{getSortIcon('user_email')}</span>
              </th>
              <th onClick={() => handleSort('title')} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                Entry <span className="ml-1">{getSortIcon('title')}</span>
              </th>
              <th onClick={() => handleSort('kind')} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                Type <span className="ml-1">{getSortIcon('kind')}</span>
              </th>
              <th onClick={() => handleSort('rating')} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                Rating <span className="ml-1">{getSortIcon('rating')}</span>
              </th>
              <th onClick={() => handleSort('created_at')} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                Date <span className="ml-1">{getSortIcon('created_at')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredActivities.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                  {item.user_email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="font-bold">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.creator}</div>
                  {item.review && (
                    <div className="text-xs text-gray-400 mt-1 italic truncate max-w-xs">"{item.review}"</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 uppercase border border-gray-200">
                      {item.kind}
                   </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {item.rating > 0 ? (
                    <span className="flex items-center gap-1 text-yellow-500">
                       {item.rating} <span className="text-lg leading-none">★</span>
                    </span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()} <span className="text-xs text-gray-300"> {new Date(item.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </td>
              </tr>
            ))}
             {filteredActivities.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">
                  No activity found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}