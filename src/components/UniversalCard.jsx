import React from 'react';
import { MapPin, Calendar, Star, Plus, ExternalLink } from 'lucide-react';

/**
 * UNIVERSAL CARD
 * Handles both "Public Events" and "User Entries".
 * * @param {Object} item - The data object (entry or public event)
 * @param {String} type - 'public' or 'entry' (Determines the footer actions)
 * @param {String} variant - 'full' (Feed) or 'snippet' (Widget)
 * @param {Function} onLog - Callback when user clicks "+" on a public event
 */
export default function UniversalCard({ item, type = 'public', variant = 'full', onLog }) {
  
  // 1. NORMALIZE DATA
  // Different sources might have different field names. We map them here.
  const title = item.title;
  const venue = item.venue || 'Unknown Venue';
  const image = item.image_url || 'https://via.placeholder.com/400x300?text=No+Image'; // Fallback
  const date = new Date(item.start_date || item.created_at).toLocaleDateString('en-IE', {
    month: 'short', day: 'numeric'
  });
  const category = item.category || 'Event';
  const rating = item.rating || 0; // Only for entries

  // --- VARIANT 1: SNIPPET (Compact Row) ---
  if (variant === 'snippet') {
    return (
      <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-100">
        {/* Tiny Image */}
        <img 
          src={image} 
          alt={title} 
          className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-gray-200"
        />
        
        {/* Compact Text */}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-gray-900 truncate">{title}</h4>
          <div className="flex items-center text-xs text-gray-500 mt-0.5">
            <span className="truncate max-w-[120px]">{venue}</span>
          </div>
        </div>

        {/* Date or Rating */}
        <div className="text-right flex-shrink-0">
          {type === 'entry' && rating > 0 ? (
            <div className="flex text-yellow-400 text-xs">★ {rating}</div>
          ) : (
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{date}</span>
          )}
        </div>
      </div>
    );
  }

  // --- VARIANT 2: FULL (Feed Card) ---
  return (
    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      
      {/* IMAGE HEADER */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-black text-xs font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {date}
        </div>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
          {category}
        </div>
      </div>

      {/* BODY */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-2">
          {title}
        </h3>
        
        <div className="flex items-start gap-1.5 text-gray-500 text-sm mb-4">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{venue}</span>
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          
          {/* Left Side: Context Specific Info */}
          {type === 'entry' ? (
             // ENTRY MODE: Show Rating
             <div className="flex gap-0.5">
               {[1, 2, 3, 4, 5].map((star) => (
                 <Star 
                   key={star} 
                   className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                 />
               ))}
             </div>
          ) : (
             // PUBLIC MODE: Show "Get Tickets" or Source
             <a 
               href={item.external_url} 
               target="_blank" 
               rel="noreferrer"
               className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors"
               onClick={(e) => e.stopPropagation()}
             >
               <ExternalLink className="w-3 h-3" />
               {item.scraper_source ? 'Tickets / Info' : 'Details'}
             </a>
          )}

          {/* Right Side: Primary Action */}
          {type === 'public' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onLog && onLog(item);
              }}
              className="flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus className="w-3 h-3" />
              Log This
            </button>
          )}
          
          {type === 'entry' && (
             <span className="text-xs font-medium text-gray-400">Logged</span>
          )}

        </div>
      </div>
    </div>
  );
}