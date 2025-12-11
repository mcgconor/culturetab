// src/pages/Admin.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. IMPORT REAL COMPONENTS
import DashboardTab from '../components/admin/DashboardTab';
import UsersTab from '../components/admin/UsersTab';
import UserActivitiesTab from '../components/admin/UserActivitiesTab';
import EventsTab from '../components/admin/EventsTab'; // <--- IMPORTANT: Real Import

// 2. PLACEHOLDERS (Only Event Log left)
const EventLogTab = () => <div className="p-6 text-gray-500">Sync Logs Coming Soon</div>;

const TABS = [
  { id: 'dashboard', name: 'Dashboard', component: DashboardTab },
  { id: 'users', name: 'Users', component: UsersTab },
  { id: 'activities', name: 'User Activities', component: UserActivitiesTab },
  { id: 'events', name: 'Events', component: EventsTab }, // <--- Uses Real Component
  { id: 'event-log', name: 'Event Log', component: EventLogTab },
];

export default function Admin({ isAdmin }) {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!isAdmin) {
    return <div className="p-12 text-center">Access Denied</div>;
  }

  const CurrentComponent = useMemo(() => {
    return TABS.find(tab => tab.id === currentTab)?.component || DashboardTab;
  }, [currentTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex justify-between items-center px-6 md:px-0 mb-6">
          <h1 className="text-3xl font-black text-gray-900">Admin Panel</h1>
          <button onClick={() => navigate('/')} className="text-sm font-bold text-gray-500 hover:text-black">
            Exit
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="border-b border-gray-200 bg-white shadow-sm mb-6">
          <nav className="-mb-px flex space-x-8 px-6 md:px-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={
                  (tab.id === currentTab
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300') +
                  ' whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors'
                }
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-lg shadow-sm min-h-[400px]">
            <CurrentComponent />
        </div>
      </div>
    </div>
  );
}