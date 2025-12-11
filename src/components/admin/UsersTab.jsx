import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles including the new last_seen column
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sorting Logic
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle dates
    if (sortConfig.key === 'created_at' || sortConfig.key === 'last_seen') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }
    // Handle text (case insensitive)
    else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue ? bValue.toLowerCase() : '';
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) return <div className="p-6 text-gray-500">Loading Users...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Registered Users</h2>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
          {users.length} Total
        </span>
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* HEADER: EMAIL */}
              <th 
                onClick={() => handleSort('email')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              >
                Email <span className="ml-1">{getSortIcon('email')}</span>
              </th>
              
              {/* HEADER: CITY */}
              <th 
                onClick={() => handleSort('city')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              >
                City <span className="ml-1">{getSortIcon('city')}</span>
              </th>

              {/* HEADER: JOINED */}
              <th 
                onClick={() => handleSort('created_at')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              >
                Joined <span className="ml-1">{getSortIcon('created_at')}</span>
              </th>

               {/* HEADER: LAST ACTIVE */}
               <th 
                onClick={() => handleSort('last_seen')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              >
                Last Active <span className="ml-1">{getSortIcon('last_seen')}</span>
              </th>

              {/* HEADER: ROLE */}
              <th 
                onClick={() => handleSort('is_admin')}
                className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              >
                Role <span className="ml-1">{getSortIcon('is_admin')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                  {user.email || 'No Email'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.city || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_seen 
                    ? new Date(user.last_seen).toLocaleDateString() + ' ' + new Date(user.last_seen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.is_admin ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                      Admin
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                      User
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500 italic">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}