import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false); // <--- New State

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
      setLoading(false);
    } else {
      setSubmitted(true); // Switch to "Check Inbox" view
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white">
      
      {/* HERO SECTION */}
      <div className="text-center max-w-2xl mb-12">
        <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-6">
          Your Personal <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Culture Log.</span>
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed">
          Stop forgetting the books you read and the films you watch. 
          CultureTab is the minimalist journal for your intellectual diet.
        </p>
      </div>

      {/* CARD CONTAINER */}
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        {submitted ? (
          // STATE 2: CHECK EMAIL
          <div className="text-center animate-fade-in-down">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✉️
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
            <p className="text-gray-500 mb-6">
              We sent a magic link to <br/>
              <span className="font-bold text-gray-800">{email}</span>
            </p>
            
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Did you type the wrong email?</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← Try a different email
              </button>
            </div>
          </div>
        ) : (
          // STATE 1: LOGIN FORM
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Sign in / Sign up
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all duration-200"
              />
            </div>
            
            <button 
              onClick={handleLogin} 
              disabled={loading || !email} 
              className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transform active:scale-[0.98] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending link...' : 'Send Magic Link →'}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">
              No password required. We'll email you a secure link.
            </p>
          </div>
        )}

      </div>
      
      {/* SOCIAL PROOF / EXTRA INFO (Optional) */}
      <div className="mt-12 flex gap-8 text-gray-400 grayscale opacity-50">
        {/* Placeholder for simple icons if you wanted "As seen on..." styles */}
      </div>

    </div>
  );
}