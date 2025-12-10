export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
        
        <div>
          &copy; {new Date().getFullYear()} CultureTab. All rights reserved.
        </div>

        <div className="flex gap-6">
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
          <a href="mailto:support@culturetab.com" className="hover:text-gray-600 transition-colors">Contact</a>
        </div>

      </div>
    </footer>
  );
}