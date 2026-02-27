import { useCopyToClipboard } from '../../../hooks';
import { Button } from '../../../components/ui';

interface CopyButtonProps {
  content: string;
}

export const CopyButton = ({ content }: CopyButtonProps) => {
  const { copied, copy } = useCopyToClipboard();

  return (
    <Button variant="outline" onClick={() => copy(content)}>
      {copied ? '已复制' : '复制代码'}
    </Button>
  );
};
