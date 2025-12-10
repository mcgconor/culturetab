export default function Stats({ entries }) {
  // 1. Calculate the numbers
  const total = entries.length;
  const books = entries.filter(e => e.kind === 'book').length;
  const films = entries.filter(e => e.kind === 'film').length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      
      {/* CARD 1: TOTAL */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total</span>
        <span className="text-3xl font-black text-gray-900 mt-1">{total}</span>
      </div>

      {/* CARD 2: BOOKS */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center">
        <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Books</span>
        <span className="text-3xl font-black text-blue-600 mt-1">{books}</span>
      </div>

      {/* CARD 3: FILMS */}
      <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center">
        <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Films</span>
        <span className="text-3xl font-black text-red-600 mt-1">{films}</span>
      </div>

    </div>
  );
}