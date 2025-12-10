import { useEffect } from 'react';

export default function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <h1 className="text-3xl font-black text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none text-gray-600 space-y-6">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
          
          <p>
            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the CultureTab website operated by us.
            Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.
          </p>

          <h3 className="text-xl font-bold text-gray-900 pt-4">1. Accounts</h3>
          <p>
            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. 
            Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>

          <h3 className="text-xl font-bold text-gray-900 pt-4">2. Content</h3>
          <p>
            Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, 
            or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
          </p>

          <h3 className="text-xl font-bold text-gray-900 pt-4">3. Termination</h3>
          <p>
            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, 
            including without limitation if you breach the Terms.
          </p>
        </div>
      </article>
    </div>
  );
}