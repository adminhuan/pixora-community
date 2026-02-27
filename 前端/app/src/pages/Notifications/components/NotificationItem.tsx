import { useNavigate } from 'react-router-dom';
import { TimeAgo } from '../../../components/shared/TimeAgo';
import { Button, Card } from '../../../components/ui';

interface NotificationItemProps {
  item: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    read?: boolean;
  };
  targetPath?: string;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotificationItem = ({ item, targetPath, onRead, onDelete }: NotificationItemProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0 }}>{item.title}</h4>
          <span style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>
            <TimeAgo value={item.createdAt} />
          </span>
        </div>
        <p style={{ margin: 0, color: 'var(--color-textSecondary)' }}>{item.content}</p>
        <div className="button-row" style={{ justifyContent: 'flex-end' }}>
          {targetPath ? (
            <Button variant="secondary" onClick={() => navigate(targetPath)}>
              查看
            </Button>
          ) : null}
          {!item.read && (
            <Button variant="outline" onClick={() => onRead?.(item.id)}>
              标记已读
            </Button>
          )}
          <Button variant="ghost" onClick={() => onDelete?.(item.id)}>
            删除
          </Button>
        </div>
      </div>
    </Card>
  );
};
