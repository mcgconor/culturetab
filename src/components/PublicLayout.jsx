import { Outlet } from 'react-router-dom';
import PublicNav from './PublicNav';
import Footer from './Footer';
import { useState } from 'react';
import EntryForm from './EntryForm'; // Reuse EntryForm for the "Sign In" modal if needed

export default function PublicLayout() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="min-h-screen bg-white animate-fade-in flex flex-col justify-between">
      
      {/* 1. Header with Sign In trigger */}
      <PublicNav onSignInClick={() => setShowLoginModal(true)} />

      {/* 2. Content */}
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-12">
        <Outlet />
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Shared Sign-In Modal (Simple version for context) */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
              <p className="text-gray-500 mb-6">Please go back to the home page to sign in or create an account.</p>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="bg-black text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800"
              >
                Close
              </button>
           </div>
        </div>
      )}
    </div>
  );
}