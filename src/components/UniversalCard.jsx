import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Plus, Edit2, Trash2, MapPin, Star } from 'lucide-react';

// --- HELPERS (Can be moved to a separate utils file later) ---
function getCreatorLabel(cat) {
    if (cat === 'book') return 'Written by';
    if (cat === 'film') return 'Directed by';
    if (cat === 'concert' || cat === 'music') return 'Performed by';
    return 'By';
}

function getCategoryColor(cat) {
    if (cat.includes('book')) return 'bg-blue-100 text-blue-800';
    if (cat.includes('film')) return 'bg-red-100 text-red-800';
    if (cat.includes('concert') || cat.includes('music')) return 'bg-purple-100 text-purple-800';
    if (cat.includes('theatre') || cat.includes('arts')) return 'bg-amber-100 text-amber-800';
    if (cat.includes('exhibition')) return 'bg-emerald-100 text-emerald-800';
    return 'bg-gray-100 text-gray-800';
}
// -----------------------------------------------------------

export default function UniversalCard({ item, type = 'public', onAction, onDelete }) {
  const navigate = useNavigate();

  // --- DATA NORMALIZATION ---
  const title = item.title;
  const id = item.id;
  const rawCategory = item.kind || item.category || 'event';
  const category = rawCategory.toLowerCase();
  
  const rawDate = item.start_date || item.event_date || item.created_at;
  const dateObj = rawDate ? new Date(rawDate) : null;
  
  const dateStr = dateObj && !isNaN(dateObj) ? dateObj.toLocaleDateString('en-IE', {day: 'numeric', month: '2-digit', year: 'numeric'}) : 'TBA';
  const timeStr = dateObj && !isNaN(dateObj) ? dateObj.toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit' }) : '';
  const month = dateObj && !isNaN(dateObj) ? dateObj.toLocaleString('default', { month: 'short' }).toUpperCase() : '---';
  const day = dateObj && !isNaN(dateObj) ? dateObj.getDate() : '--';

  const subtitle = type === 'entry' ? item.creator : item.venue;
  const subtitleLabel = type === 'entry' ? getCreatorLabel(category) : null; 
  const rating = item.rating || 0;


  // --- RENDER ---
  return (
    <div 
      onClick={() => navigate(type === 'entry' ? `/entry/${id}` : `/event/${id}`)}
      className="group bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer relative flex gap-4 sm:gap-5"
    >
      
      {/* 1. LEFT: DATE BLOCK (Strong Visual Element) */}
      <div className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-32 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center p-2">
        <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{month}</span>
        <span className="text-3xl font-black text-gray-900 leading-none my-1">{day}</span>
        <span className="text-[10px] text-gray-400 font-medium">{timeStr}</span>
      </div>

      {/* 2. MIDDLE: CONTENT & ACTIONS (Uses flex-grow/flex-col/justify-between) */}
      <div className="flex-grow flex flex-col justify-between py-0.5 min-w-0">
        
        {/* TOP CONTENT BLOCK: Title, Subtitle, Date/Time */}
        <div> 
          
          {/* Header Row: Title and Metadata Block */}
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-black text-lg text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors pr-2">
              {title}
            </h3>
            
            {/* --- METADATA BLOCK (TOP RIGHT) --- */}
            <div className="flex-shrink-0 flex flex-col items-end pt-1"> 
                
                {/* 1. Category Lozenges */}
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border border-transparent ${getCategoryColor(category)} mb-0.5`}>
                  {category}
                </span>

                {/* 2. Rating Stars (Entries ONLY) */}
                {type === 'entry' && (
                  <div className="flex gap-0.5 text-xs">
                     {[...Array(5)].map((_, i) => (
                       <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                     ))}
                  </div>
                )}
            </div>
            {/* ---------------------------------- */}
          </div>

          {/* Subtitle (Director or Venue) */}
          <div className="mb-2">
             {subtitleLabel && (
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                 {subtitleLabel}
               </p>
             )}
             <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 line-clamp-1">
                {type === 'public' && <MapPin className="w-3.5 h-3.5 text-gray-400" />}
                {subtitle || 'Unknown'}
             </div>
          </div>
          
          {/* Date Row (The data point the user is looking for) */}
          <div className="text-xs font-bold text-gray-500">
             {type === 'public' && <span>{dateStr} at {timeStr}</span>}
             {type === 'entry' && <span className="text-xs font-bold text-gray-400">Logged on {dateStr}</span>}
          </div>
        </div>
        
        {/* 3. BOTTOM ROW: ACTIONS - Pushed to the bottom */}
        <div className="mt-3 pt-2 border-t border-gray-50 flex justify-end gap-3">
          
          {type === 'entry' ? (
            // ENTRY ACTIONS 
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onAction && onAction(item); }}
                className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete && onDelete(item.id); }}
                className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </>
          ) : (
            // PUBLIC ACTIONS
            <>
              {item.external_url && (
                <a 
                  href={item.external_url} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> More Info
                </a>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); onAction && onAction(item); }}
                className="flex items-center gap-1 bg-black text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full hover:bg-gray-800 transition-transform active:scale-95 shadow-sm ml-2"
              >
                <Plus className="w-3 h-3" /> Log This
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}