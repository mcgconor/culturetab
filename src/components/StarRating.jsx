export default function StarRating({ rating }) {
  // Ensure rating is a number (handle string inputs)
  const score = parseFloat(rating) || 0;
  
  // Calculate full stars, half stars, and empty stars
  const fullStars = Math.floor(score);
  const hasHalfStar = score % 1 !== 0;
  // Total stars is 5. Empty stars fill the rest.
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex text-yellow-400 text-sm tracking-tighter">
      {/* Full Stars */}
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`}>★</span>
      ))}
      
      {/* Half Star (We use a special character or styling) */}
      {hasHalfStar && <span className="relative inline-block overflow-hidden w-[0.5em] align-top text-yellow-400">★</span>}
      
      {/* Empty Stars (Gray) */}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="text-gray-200">★</span>
      ))}
    </div>
  );
}