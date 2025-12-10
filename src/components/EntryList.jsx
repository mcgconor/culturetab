import { Link } from 'react-router-dom';
import StarRating from './StarRating'; // <--- 1. IMPORT

const typeColors = {
  book: "bg-blue-100 text-blue-700 border-blue-200",
  film: "bg-red-100 text-red-700 border-red-200",
  concert: "bg-purple-100 text-purple-700 border-purple-200",
  theatre: "bg-amber-100 text-amber-700 border-amber-200",
  exhibition: "bg-emerald-100 text-emerald-700 border-emerald-200",
  default: "bg-gray-100 text-gray-700 border-gray-200"
};

export default function EntryList({ entries, onDelete, onEdit }) {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const badgeColor = typeColors[entry.kind] || typeColors.default;
        
        return (
          <div key={entry.id} className="group bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            
            {/* ROW 1: Badge + Rating */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${badgeColor}`}>
                {entry.kind}
              </span>
              
              {/* 2. USE THE NEW COMPONENT */}
              <StarRating rating={entry.rating} /> 
            </div>

            {/* ROW 2: Title & Creator */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">
                <Link to={`/entry/${entry.id}`} className="hover:text-blue-600 transition-colors">
                  {entry.title}
                </Link>
              </h3>
              {entry.creator && (
                <p className="text-sm text-gray-500">
                  by <span className="font-medium text-gray-700">{entry.creator}</span>
                </p>
              )}
            </div>

            {/* ROW 3: Date & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400">
                Logged {new Date(entry.event_date).toLocaleDateString()}
              </span>
              
              <div className="flex gap-4">
                {onEdit && (
                  <button onClick={() => onEdit(entry)} className="text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-wider transition-colors">
                    Edit
                  </button>
                )}
                <button onClick={() => onDelete(entry.id)} className="text-xs font-bold text-gray-400 hover:text-red-600 uppercase tracking-wider transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}