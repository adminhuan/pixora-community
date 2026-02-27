import { Button, Space } from 'antd';

interface AuditActionsProps {
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  loading?: boolean;
}

export const AuditActions = ({ onApprove, onReject, onDelete, loading = false }: AuditActionsProps) => (
  <Space>
    <Button type="primary" onClick={onApprove} loading={loading} disabled={loading}>
      通过
    </Button>
    <Button onClick={onReject} loading={loading} disabled={loading}>
      拒绝
    </Button>
    <Button danger onClick={onDelete} loading={loading} disabled={loading}>
      删除
    </Button>
  </Space>
);
