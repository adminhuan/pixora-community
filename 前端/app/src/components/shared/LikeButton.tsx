import { useState } from 'react';
import { Button } from '../ui';

interface LikeButtonProps {
  count?: number;
  onToggle?: (liked: boolean) => void;
}

export const LikeButton = ({ count = 0, onToggle }: LikeButtonProps) => {
  const [liked, setLiked] = useState(false);

  return (
    <Button
      variant={liked ? 'secondary' : 'outline'}
      onClick={() => {
        const next = !liked;
        setLiked(next);
        onToggle?.(next);
      }}
    >
      点赞 {count + (liked ? 1 : 0)}
    </Button>
  );
};
