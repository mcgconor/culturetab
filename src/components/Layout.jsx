import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

export default function Layout({ session, onLogClick }) {
  return (
    <div className="min-h-screen bg-white animate-fade-in relative">
      
      {/* 1. The Global Header */}
      <TopNav session={session} onLogClick={onLogClick} />

      {/* 2. The Global Container 
          This controls the spacing for ALL pages (Dashboard, Events, History).
          No more manual padding in individual files.
      */}
      <main className="max-w-3xl mx-auto pb-20">
        <Outlet />
      </main>

    </div>
  );
}