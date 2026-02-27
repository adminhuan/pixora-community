import { relativeTime } from '../../utils';

interface TimeAgoProps {
  value?: string;
}

export const TimeAgo = ({ value }: TimeAgoProps) => <span>{relativeTime(value)}</span>;
