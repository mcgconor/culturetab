import { useState } from 'react';
import { supabase } from '../supabaseClient';
import EntryForm from './EntryForm';
import PublicNav from './PublicNav'; // <--- IMPORT THIS

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Toggle to show/hide the guest form
  const [showGuestForm, setShowGuestForm] = useState(false); 
  
  const [pendingData, setPendingData] = useState(null);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (pendingData) {
      localStorage.setItem('pendingEntry', JSON.stringify(pendingData));
    }

    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: { emailRedirectTo: window.location.origin }
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  };

  const handleGuestSubmit = (formData) => {
    setPendingData(formData);
    setShowLoginModal(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      
      {/* 1. PUBLIC NAVIGATION (Logo Header) */}
      <PublicNav />

      {/* 2. MAIN CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-12 sm:pt-20">
        
        {/* HERO SECTION */}
        <div className="text-center mb-10 animate-fade-in-down">
          <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-4">
            Start your CultureLog.
          </h1>
          <p className="text-xl text-gray-500 mb-8">
            Track the books, films, and art that matter to you. <br/>
            <span className="font-bold text-gray-900">Try it now — no account needed yet.</span>
          </p>

          {/* THE TRIGGER BUTTON (Only visible if form is hidden) */}
          {!showGuestForm && (
            <div className="space-y-4">
              <button 
                onClick={() => setShowGuestForm(true)}
                className="bg-black text-white text-lg font-bold py-4 px-8 rounded-xl hover:bg-gray-800 transform active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
              >
                + Log New Entry
              </button>
              
              <div className="pt-2">
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="text-sm font-bold text-gray-400 hover:text-black transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </div>
          )}
        </div>

        {/* GUEST FORM (Slides down when active) */}
        {showGuestForm && !submitted && !showLoginModal && (
          <div className="animate-fade-in-down">
            <EntryForm 
              onAddEntry={handleGuestSubmit} 
              onCancel={() => setShowGuestForm(false)} 
            />
          </div>
        )}

      </div>

      {/* 3. THE LOGIN / SAVE MODAL */}
      {(showLoginModal || submitted) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            
            {submitted ? (
              <div className="text-center">
                <div className="text-4xl mb-4">✉️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
                <p className="text-gray-500 mb-6">
                  We sent a magic link to <strong>{email}</strong>.
                  <br/>Click it to save your entry!
                </p>
                <button onClick={() => setSubmitted(false)} className="text-blue-600 font-bold text-sm">
                  Try different email
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {pendingData ? 'Save your entry' : 'Welcome back'}
                </h2>
                <p className="text-gray-500 mb-6">
                  {pendingData 
                    ? `Enter your email to save "${pendingData.title}" and create your account.` 
                    : 'Enter your email to sign in.'}
                </p>

                <form onSubmit={handleMagicLink} className="space-y-4">
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black transition-colors"
                    autoFocus
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-transform active:scale-[0.98]"
                  >
                    {loading ? 'Sending...' : pendingData ? 'Save Entry & Sign In' : 'Send Magic Link'}
                  </button>
                </form>

                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="w-full mt-4 text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}