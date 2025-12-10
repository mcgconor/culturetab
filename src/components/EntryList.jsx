export default function EntryList({ entries, onDelete, onEdit }) {
  
  const getCreatorLabel = (kind) => {
    if (kind === 'book') return 'Written by';
    if (kind === 'film') return 'Directed by';
    if (kind === 'concert' || kind === 'music') return 'Performed by';
    if (kind === 'theatre') return 'Production by';
    if (kind === 'exhibition') return 'Curated by';
    return 'By';
  };

  const getCategoryColor = (kind) => {
    switch(kind) {
      case 'book': return 'bg-blue-100 text-blue-700';
      case 'film': return 'bg-red-100 text-red-700';
      case 'concert': return 'bg-purple-100 text-purple-700';
      case 'theatre': return 'bg-amber-100 text-amber-700';
      case 'exhibition': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex gap-4 sm:gap-6">
            
            {/* THUMBNAIL */}
            <div className="flex-shrink-0">
              {entry.image_url ? (
                <img 
                  src={entry.image_url} 
                  alt={entry.title} 
                  className="w-20 h-28 sm:w-24 sm:h-36 object-cover rounded-lg shadow-sm" 
                />
              ) : (
                <div className="w-20 h-28 sm:w-24 sm:h-36 bg-gray-50 rounded-lg flex items-center justify-center text-3xl shadow-inner border border-gray-100">
                  <span className="opacity-50">?</span>
                </div>
              )}
            </div>

            {/* CONTENT */}
            <div className="flex-grow flex flex-col justify-between py-0.5">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-black text-lg sm:text-xl text-gray-900 leading-tight line-clamp-2">
                    {entry.title}
                  </h3>
                  
                  {/* RATING */}
                  <div className="flex-shrink-0 flex gap-0.5 pt-1 pl-2">
                     {[...Array(5)].map((_, i) => (
                       <span key={i} className={`text-xs ${i < entry.rating ? 'text-black' : 'text-gray-200'}`}>★</span>
                     ))}
                  </div>
                </div>

                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                  {getCreatorLabel(entry.kind)}
                </p>
                <p className="text-sm sm:text-base font-bold text-gray-700 mb-3 line-clamp-1">
                  {entry.creator}
                </p>

                {/* PILL & DATE */}
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${getCategoryColor(entry.kind)}`}>
                    {entry.kind}
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    {new Date(entry.event_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              {/* Desktop: Normal size. Mobile: Tiny size text-[10px] */}
              <div className="flex justify-end gap-3 mt-3 border-t border-gray-50 pt-2 sm:border-none sm:pt-0">
                <button 
                  onClick={() => onEdit(entry)}
                  className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(entry.id)}
                  className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}