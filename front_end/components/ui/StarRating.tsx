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

interface StarRatingDisplayProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export function StarRatingDisplay({ rating, size = 'md', showValue = false }: StarRatingDisplayProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const starSize = sizeClasses[size];

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercentage =
          rating >= star
            ? '100%'
            : rating >= star - 0.5
            ? '50%'
            : '0%';

        return (
          <div key={star} className="relative">
            <Star className={`${starSize} text-gray-300`} />
            <div
              className="absolute top-0 left-0 h-full overflow-hidden"
              style={{ width: fillPercentage }}
            >
              <Star className={`${starSize} text-yellow-400`} fill="currentColor" />
            </div>
          </div>
        );
      })}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
} 