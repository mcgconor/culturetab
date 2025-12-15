import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

export default function Layout({ session, onLogClick }) {
  return (
    <div className="min-h-screen bg-white animate-fade-in relative">
      
      {/* GLOBAL HEADER */}
      <TopNav session={session} onLogClick={onLogClick} />

      {/* GLOBAL CONTENT CONTAINER */}
      <main className="max-w-3xl mx-auto pb-20">
        <Outlet />
      </main>

    </div>
  );
}