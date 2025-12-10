import { useState } from 'react';

export default function StarRatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);

  // The value displayed is either the user's hover state OR the saved value
  const displayValue = hover > 0 ? hover : value;

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        
        // Calculate how much of this specific star should be filled (0%, 50%, or 100%)
        let fillPercentage = '0%';
        if (displayValue >= starIndex) {
          fillPercentage = '100%';
        } else if (displayValue >= starIndex - 0.5) {
          fillPercentage = '50%';
        }

        return (
          <div key={starIndex} className="relative w-6 h-6 sm:w-8 sm:h-8 cursor-pointer">
            
            {/* 1. BACKGROUND STAR (Grey) - Always visible */}
            <svg
              className="absolute top-0 left-0 w-full h-full text-gray-200 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>

            {/* 2. FOREGROUND STAR (Black) - Width gets clipped */}
            <div 
              className="absolute top-0 left-0 h-full overflow-hidden transition-all duration-100"
              style={{ width: fillPercentage }}
            >
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-black fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>

            {/* 3. INTERACTION ZONES (Invisible Buttons) */}
            
            {/* Left Half Click Target (0.5) */}
            <button
              type="button"
              className="absolute top-0 left-0 w-1/2 h-full bg-transparent z-10"
              onClick={() => onChange(starIndex - 0.5)}
              onMouseEnter={() => setHover(starIndex - 0.5)}
              aria-label={`Rate ${starIndex - 0.5} stars`}
            />

            {/* Right Half Click Target (1.0) */}
            <button
              type="button"
              className="absolute top-0 right-0 w-1/2 h-full bg-transparent z-10"
              onClick={() => onChange(starIndex)}
              onMouseEnter={() => setHover(starIndex)}
              aria-label={`Rate ${starIndex} stars`}
            />
          </div>
        );
      })}
      
      {/* Display numeric rating on the side for clarity */}
      <div className="ml-2 w-8 text-xs font-bold text-gray-400 tabular-nums pt-0.5">
        {displayValue > 0 ? displayValue.toFixed(1) : '0.0'}
      </div>
    </div>
  );
}