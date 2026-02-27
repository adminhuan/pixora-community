import { useState } from 'react';
import { Button } from '../ui';

interface FavoriteButtonProps {
  count?: number;
  onToggle?: (favorited: boolean) => void;
}

export const FavoriteButton = ({ count = 0, onToggle }: FavoriteButtonProps) => {
  const [favorited, setFavorited] = useState(false);

  return (
    <Button
      variant={favorited ? 'secondary' : 'outline'}
      onClick={() => {
        const next = !favorited;
        setFavorited(next);
        onToggle?.(next);
      }}
    >
      收藏 {count + (favorited ? 1 : 0)}
    </Button>
  );
};
