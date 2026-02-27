import { Button } from '../ui';

interface ReportButtonProps {
  onReport?: () => void;
}

export const ReportButton = ({ onReport }: ReportButtonProps) => (
  <Button variant="ghost" onClick={onReport}>
    举报
  </Button>
);
