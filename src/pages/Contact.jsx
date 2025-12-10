import { useEffect, useState } from 'react';

export default function Contact() {
  const [result, setResult] = useState("");

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setResult("Sending...");
    const formData = new FormData(event.target);

    // REPLACE THIS STRING WITH YOUR KEY
    formData.append("access_key", "8a9c825b-43c2-4656-9508-cde02cb1e5c7");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        setResult("Message sent! We'll be in touch soon.");
        event.target.reset();
      } else {
        setResult(data.message);
      }
    } catch (error) {
      setResult("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-500 mb-8">Found a bug or have a feature request?</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="subject" value="New Submission from CultureTab" />
          
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Your Name</label>
            <input type="text" name="name" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-black transition-colors" />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
            <input type="email" name="email" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-black transition-colors" />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Message</label>
            <textarea name="message" required rows="4" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-black transition-colors"></textarea>
          </div>

          <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all">
            Send Message
          </button>
        </form>
        
        {result && <div className="mt-4 text-center text-sm font-bold text-green-600 animate-pulse">{result}</div>}
      </div>
    </div>
  );
}