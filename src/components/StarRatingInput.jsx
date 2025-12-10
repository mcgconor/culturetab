import { useState } from 'react';

export default function StarRatingInput({ value, onChange }) {
  const [hoverValue, setHoverValue] = useState(null);

  const handleMouseMove = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; 
    const isHalf = x < rect.width / 2;
    setHoverValue(index + (isHalf ? 0.5 : 1));
  };

  const displayValue = hoverValue ?? value;

  return (
    <div>
      <div className="flex gap-1" onMouseLeave={() => setHoverValue(null)}>
        {[0, 1, 2, 3, 4].map((index) => {
          // Calculate how much of this specific star is filled (0%, 50%, or 100%)
          let fill = 0;
          if (displayValue >= index + 1) fill = 100;
          else if (displayValue >= index + 0.5) fill = 50;

          return (
            <div
              key={index}
              className="relative w-8 h-8 cursor-pointer transition-transform hover:scale-110"
              onMouseMove={(e) => handleMouseMove(e, index)}
              onClick={() => onChange(hoverValue)}
            >
              {/* Empty Star Background (Gray) */}
              <svg className="w-full h-full text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              
              {/* Filled Star Overlay (Yellow) - Clipped based on fill % */}
              <div 
                className="absolute top-0 left-0 h-full overflow-hidden text-yellow-400 pointer-events-none"
                style={{ width: `${fill}%` }}
              >
                <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wider h-4">
        {displayValue > 0 ? `${displayValue} Stars` : ''}
      </div>
    </div>
  );
}