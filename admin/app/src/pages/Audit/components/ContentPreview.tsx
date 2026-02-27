import { Card } from 'antd';
import { SafeMarkdown } from '../../../components/shared/safe-markdown';

interface ContentPreviewProps {
  title: string;
  content: string;
}

export const ContentPreview = ({ title, content }: ContentPreviewProps) => (
  <Card size="small" title={title}>
    <SafeMarkdown content={content} style={{ margin: 0, color: '#475569' }} />
  </Card>
);
