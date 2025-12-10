import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: window.location.origin 
      }
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      
      {/* CARD CONTAINER */}
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-2">
            CultureTab
          </h1>
          <p className="text-gray-500 text-lg">
            Your personal archive for books, films, and art.
          </p>
        </div>

        {/* FORM */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Sign in via Magic Link
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all duration-200"
            />
          </div>
          
          <button 
            onClick={handleLogin} 
            disabled={loading} 
            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transform active:scale-[0.98] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending link...' : 'Send Magic Link →'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            No password required. We'll email you a secure link.
          </p>
        </div>

      </div>
    </div>
  );
}