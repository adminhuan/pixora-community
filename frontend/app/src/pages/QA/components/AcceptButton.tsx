import { Button } from '../../../components/ui';

interface AcceptButtonProps {
  onAccept: () => void;
}

export const AcceptButton = ({ onAccept }: AcceptButtonProps) => (
  <Button variant="secondary" onClick={onAccept}>
    设为最佳答案
  </Button>
);
