'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  readOnly?: boolean;
}

export function StarRating({ rating, onRatingChange, readOnly = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleRating = (rate: number) => {
    if (!readOnly) {
      onRatingChange(rate);
    }
  };

  const handleMouseEnter = (rate: number) => {
    if (!readOnly) {
      setHoverRating(rate);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const currentRating = hoverRating || rating;
        const fillPercentage =
          currentRating >= star
            ? '100%'
            : currentRating >= star - 0.5
            ? '50%'
            : '0%';

        return (
          <div
            key={star}
            className="relative cursor-pointer"
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="absolute w-1/2 h-full left-0 top-0 z-10"
              onMouseEnter={() => handleMouseEnter(star - 0.5)}
              onClick={() => handleRating(star - 0.5)}
            />
            <div
              className="absolute w-1/2 h-full right-0 top-0 z-10"
              onMouseEnter={() => handleMouseEnter(star)}
              onClick={() => handleRating(star)}
            />
            <Star className="w-8 h-8 text-gray-300" />
            <div
              className="absolute top-0 left-0 h-full overflow-hidden"
              style={{ width: fillPercentage }}
            >
              <Star className="w-8 h-8 text-yellow-400" fill="currentColor" />
            </div>
          </div>
        );
      })}
    </div>
  );
} 