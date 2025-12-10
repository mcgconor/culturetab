import { useNavigate } from 'react-router-dom';

export default function Stats({ entries }) {
  const navigate = useNavigate();

  // Calculate counts
  const total = entries.length;
  const books = entries.filter(e => e.kind === 'book').length;
  const films = entries.filter(e => e.kind === 'film').length;
  const events = entries.filter(e => ['concert', 'theatre', 'exhibition'].includes(e.kind)).length;

  const handleClick = (category) => {
    // Navigate to history and pass the category we want to filter by
    navigate('/history', { state: { initialCategory: category } });
  };

  const cardClass = "bg-gray-50 rounded-2xl p-4 flex flex-col justify-between h-24 cursor-pointer hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 active:scale-95 transform transition-transform";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
      
      {/* TOTAL (No filter) */}
      <div className={cardClass} onClick={() => navigate('/history')}>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Logs</span>
        <span className="text-3xl font-black text-gray-900">{total}</span>
      </div>

      {/* BOOKS */}
      <div className={cardClass} onClick={() => handleClick('book')}>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Books</span>
        <span className="text-3xl font-black text-gray-900">{books}</span>
      </div>

      {/* FILMS */}
      <div className={cardClass} onClick={() => handleClick('film')}>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Films</span>
        <span className="text-3xl font-black text-gray-900">{films}</span>
      </div>

      {/* EVENTS (Maps to 'concert' but we can just filter by 'concert' or show all events) */}
      {/* For simplicity, let's link this to 'concert' or just leave it as a general link to history */}
      <div className={cardClass} onClick={() => handleClick('concert')}>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Events</span>
        <span className="text-3xl font-black text-gray-900">{events}</span>
      </div>

    </div>
  );
}