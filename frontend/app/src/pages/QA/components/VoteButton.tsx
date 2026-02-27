import { useState } from 'react';
import { Button } from '../../../components/ui';

interface VoteButtonProps {
  value: number;
}

export const VoteButton = ({ value }: VoteButtonProps) => {
  const [score, setScore] = useState(value);

  return (
    <div className="button-row">
      <Button variant="outline" onClick={() => setScore((prev) => prev + 1)}>
        顶
      </Button>
      <span style={{ minWidth: 24, textAlign: 'center' }}>{score}</span>
      <Button variant="outline" onClick={() => setScore((prev) => prev - 1)}>
        踩
      </Button>
    </div>
  );
};
