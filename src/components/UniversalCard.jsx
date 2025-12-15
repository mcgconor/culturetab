import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, MapPin, Star } from 'lucide-react';

// --- HELPERS ---
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

function getDateLabel(cat) {
    if (cat.includes('book')) return 'Read on';
    if (cat.includes('film') || cat.includes('movie')) return 'Watched on';
    if (cat.includes('exhibition') || cat.includes('museum') || cat.includes('gallery')) return 'Visited on';
    if (cat.includes('concert') || cat.includes('theatre') || cat.includes('gig')) return 'Attended on';
    return 'Logged on'; 
}

export default function UniversalCard({ item, type = 'public', onAction, onDelete }) {
  const navigate = useNavigate();

  // --- DATA NORMALIZATION ---
  const title = item.title;
  const id = item.id;
  const rawCategory = item.kind || item.category || 'event';
  const category = rawCategory.toLowerCase();
  
  const rawDate = item.start_date || item.event_date || item.created_at;
  const dateObj = rawDate ? new Date(rawDate) : null;
  
  // Date Strings
  const dateStr = dateObj && !isNaN(dateObj) 
    ? dateObj.toLocaleDateString('en-IE', {day: '2-digit', month: '2-digit', year: 'numeric'}) 
    : 'TBA';
  const timeStr = dateObj && !isNaN(dateObj) ? dateObj.toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit' }) : '';
  const month = dateObj && !isNaN(dateObj) ? dateObj.toLocaleString('default', { month: 'short' }).toUpperCase() : '---';
  const day = dateObj && !isNaN(dateObj) ? dateObj.getDate() : '--';
  const rating = item.rating || 0;

  // --- SUBTITLE LOGIC ---
  let subtitle = null;
  let subtitleLabel = null;

  if (type === 'public') {
      subtitle = item.venue;
  } else {
      const isLiveEvent = ['concert', 'music', 'theatre', 'arts', 'comedy', 'exhibition'].some(c => category.includes(c));
      
      if (isLiveEvent) {
          if (item.venue) {
              subtitle = item.venue;
              subtitleLabel = category.includes('exhibition') ? 'Held at' : 'Performed at';
          } else {
              subtitle = item.creator;
              subtitleLabel = 'Performed by';
          }
      } else {
          subtitle = item.creator;
          subtitleLabel = getCreatorLabel(category);
      }
  }

  // --- HANDLER: Internal Navigation ---
  const handleCardClick = () => {
      navigate(type === 'entry' ? `/entry/${id}` : `/event/${id}`);
  };

  // --- RENDER ---
  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer relative flex gap-4 sm:gap-5"
    >
      
      {/* 1. LEFT: VISUAL (Image OR Date Block) */}
      <div className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-32 rounded-lg border border-gray-100 overflow-hidden bg-gray-50">
        {item.image_url ? (
           // IF IMAGE EXISTS: Show it
           <img 
             src={item.image_url} 
             alt={title} 
             className="w-full h-full object-cover"
             onError={(e) => {e.target.style.display='none';}} // Fallback logic could go here
           />
        ) : (
           // NO IMAGE: Show Date Block
           <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
             <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{month}</span>
             <span className="text-3xl font-black text-gray-900 leading-none my-1">{day}</span>
             <span className="text-[10px] text-gray-400 font-medium">{timeStr}</span>
           </div>
        )}
      </div>

      {/* 2. MIDDLE: CONTENT & ACTIONS */}
      <div className="flex-grow flex flex-col justify-between py-0.5 min-w-0 relative">
        
        {/* TOP CONTENT BLOCK */}
        <div> 
          
          {/* TITLE */}
          <h3 className="font-black text-lg text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors mb-1 pr-24">
              {title}
          </h3>

          {/* ABSOLUTE METADATA (Top Right) */}
          <div className="absolute top-0 right-0 flex items-center gap-2"> 
                {type === 'entry' && rating > 0 && (
                  <div className="flex items-center bg-yellow-50 text-yellow-700 px-1.5 py-1 rounded-md border border-yellow-100">
                     <span className="text-[10px] font-bold mr-0.5">{rating}</span>
                     <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  </div>
                )}
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border border-transparent ${getCategoryColor(category)}`}>
                  {category}
                </span>
          </div>

          {/* SUBTITLE */}
          <div className="mb-2">
             {subtitleLabel && (
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                 {subtitleLabel}
               </p>
             )}
             <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 line-clamp-1">
                {(type === 'public' || (type === 'entry' && (subtitleLabel === 'Performed at' || subtitleLabel === 'Held at'))) && (
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                )}
                {subtitle || 'Unknown'}
             </div>
          </div>
          
          {/* DATE ROW (Public Only - since Image might hide day/month) */}
          <div className="text-xs font-bold text-gray-500">
             {type === 'public' && <span>{dateStr} at {timeStr}</span>}
          </div>
        </div>
        
        {/* 3. BOTTOM ROW: ACTIONS + DATE FOOTER */}
        <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center gap-3">
          
          {/* LEFT: DYNAMIC DATE LABEL */}
          <div className="text-[10px] font-bold text-gray-400">
            {type === 'entry' && <span>{getDateLabel(category)} {dateStr}</span>}
          </div>

          {/* RIGHT: BUTTONS */}
          <div className="flex gap-3">
            {type === 'entry' ? (
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
                <>
                {/* PUBLIC: READ MORE (Internal Link) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                  className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <span>Read more</span>
                  <span className="text-base leading-none mb-0.5">→</span>
                </button>

                {/* PUBLIC: LOG THIS */}
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
    </div>
  );
}