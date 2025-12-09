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
        // This line is the magic fix:
        // It tells Supabase to redirect you back to wherever you currently are.
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
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2>Welcome to CultureTab</h2>
      <p>Sign in via Magic Link</p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "10px" }}
        />
        
        <button onClick={handleLogin} disabled={loading} style={{ padding: "10px" }}>
          {loading ? 'Sending link...' : 'Send Magic Link'}
        </button>
      </div>
    </div>
  );
}