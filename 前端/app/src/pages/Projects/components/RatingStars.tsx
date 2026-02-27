import { useState } from 'react';

interface RatingStarsProps {
  value?: number;
  onChange?: (value: number) => void;
}

export const RatingStars = ({ value = 0, onChange }: RatingStarsProps) => {
  const [rating, setRating] = useState(value);

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: 5 }).map((_, index) => {
        const score = index + 1;
        const active = score <= rating;

        return (
          <button
            key={score}
            type="button"
            onClick={() => {
              setRating(score);
              onChange?.(score);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: active ? '#F59E0B' : '#CBD5E1',
              cursor: 'pointer',
              fontSize: 20,
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
};
