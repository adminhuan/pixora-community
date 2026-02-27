import { Button } from '../../../components/ui';
import { openSafeUrlInNewTab } from '../../../utils';

interface DemoButtonProps {
  url?: string;
}

export const DemoButton = ({ url }: DemoButtonProps) => (
  <Button
    variant="secondary"
    onClick={() => {
      if (url) {
        openSafeUrlInNewTab(url);
      }
    }}
  >
    在线演示
  </Button>
);
