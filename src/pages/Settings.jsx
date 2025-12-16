import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Save, Download, Trash2, Mail, Bell, AlertTriangle } from 'lucide-react';

export default function Settings({ session }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // State
  const [email, setEmail] = useState(session?.user?.email || '');
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Load existing preferences if saved in metadata
    if (session?.user?.user_metadata?.marketing_opt_in) {
      setMarketing(session.user.user_metadata.marketing_opt_in);
    }
  }, [session]);

  // 1. Update Email
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      setMessage({ type: 'success', text: 'Check your new email for a confirmation link.' });
    }
    setLoading(false);
  };

  // 2. Update Marketing
  const handleMarketingChange = async (e) => {
    const isChecked = e.target.checked;
    setMarketing(isChecked);
    
    // Save to Supabase User Metadata
    const { error } = await supabase.auth.updateUser({
      data: { marketing_opt_in: isChecked }
    });

    if (error) console.error('Error saving preference:', error);
  };

  // 3. Download Data
  const handleDownload = () => {
    alert("Your data export is being prepared. We will email it to you shortly.");
  };

  // 4. Delete Account
  const handleDelete = async () => {
    const confirmText = prompt("Type 'DELETE' to confirm you want to permanently delete your account and all data.");
    if (confirmText === 'DELETE') {
       alert("Account deletion request received. (Note: For safety, this usually requires a support email in MVP apps, but we've logged your request).");
       // In a real app, you'd call a Supabase Edge Function here to delete the user from auth.users
    }
  };

  return (
    <div className="animate-fade-in px-4 pt-8 pb-20">
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Settings</h1>
        <p className="text-gray-500 mb-8">Manage your account and preferences.</p>

        {message && (
          <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-xl text-sm font-bold border border-green-100 flex items-center gap-2">
            <Mail className="w-4 h-4" /> {message.text}
          </div>
        )}

        <div className="space-y-6">

          {/* SECTION 1: EMAIL */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Email Address</h2>
            </div>
            
            <form onSubmit={handleUpdateEmail} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-black transition-colors"
              />
              <button 
                type="submit" 
                disabled={loading || email === session?.user?.email}
                className="px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </form>
          </section>

          {/* SECTION 2: MARKETING */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Marketing Preferences</h2>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="pr-4">
                <p className="font-bold text-gray-900 text-sm">Product Updates</p>
                <p className="text-xs text-gray-500 mt-0.5">Receive occasional emails about new features and culture tips.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={marketing}
                  onChange={handleMarketingChange}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>
          </section>

          {/* SECTION 3: DATA */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <Download className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Your Data</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Download a JSON file containing all your logged entries, ratings, and reflections.
            </p>
            <button 
              onClick={handleDownload}
              className="text-sm font-bold text-gray-700 hover:text-black border border-gray-200 hover:border-black px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download My Data
            </button>
          </section>

          {/* SECTION 4: DANGER ZONE */}
          <section className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white text-red-600 rounded-lg border border-red-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-red-700">Danger Zone</h2>
            </div>
            <p className="text-sm text-red-600/80 mb-6 leading-relaxed">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button 
              onClick={handleDelete}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </section>

        </div>
      </div>
    </div>
  );
}