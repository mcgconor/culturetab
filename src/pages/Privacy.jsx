import { useEffect } from 'react';

export default function Privacy() {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <h1 className="text-3xl font-black text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none text-gray-600 space-y-6">
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
          
          <p>
            Welcome to CultureTab. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our website 
            and tell you about your privacy rights and how the law protects you.
          </p>

          <h3 className="text-xl font-bold text-gray-900 pt-4">1. Data We Collect</h3>
          <p>
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Identity Data</strong> includes email address.</li>
              <li><strong>Usage Data</strong> includes information about how you use our website.</li>
              <li><strong>Content Data</strong> includes the entries (books, films, etc.) you log into the system.</li>
            </ul>
          </p>

          <h3 className="text-xl font-bold text-gray-900 pt-4">2. How We Use Your Data</h3>
          <p>
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data 
            to provide the service you have requested (i.e., maintaining your culture log).
          </p>

          <h3 className="text-xl font-bold text-gray-900 pt-4">3. Data Security</h3>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
            used or accessed in an unauthorized way, altered or disclosed.
          </p>
        </div>
      </article>
    </div>
  );
}