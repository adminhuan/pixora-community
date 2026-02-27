import { Card, Tag } from 'antd';
import { AuditActions } from './AuditActions';
import { ContentPreview } from './ContentPreview';

interface AuditCardProps {
  item: {
    id: string;
    type: string;
    title: string;
    content: string;
    reportCount: number;
  };
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  loading?: boolean;
}

export const AuditCard = ({ item, onApprove, onReject, onDelete, loading = false }: AuditCardProps) => (
  <Card
    title={
      <span>
        {item.type} #{item.id} <Tag color="orange">举报 {item.reportCount}</Tag>
      </span>
    }
    extra={
      <AuditActions
        onApprove={onApprove}
        onReject={onReject}
        onDelete={onDelete}
        loading={loading}
      />
    }
  >
    <ContentPreview title={item.title} content={item.content} />
  </Card>
);
