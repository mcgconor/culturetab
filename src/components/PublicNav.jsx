export default function PublicNav() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="font-black text-xl tracking-tighter flex items-center gap-2 text-gray-900 select-none">
            <span className="bg-black text-white px-2 py-0.5 rounded-md text-sm">C</span>
            <span>CultureTab</span>
        </div>

        {/* Optional: You could add a 'Help' or 'About' link here later */}
      </div>
    </header>
  );
}