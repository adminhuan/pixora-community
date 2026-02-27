import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Table, Tag } from 'antd';
import { adminAuditApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { AuditStats } from './components/AuditStats';

const AuditHistoryPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminAuditApi.history();
        setData(extractList<Record<string, unknown>>(response));
      } catch (err) {
        setError(getErrorMessage(err, '审核历史加载失败'));
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, []);

  const stats = useMemo(() => {
    const resolved = data.filter((item) => String(item.status ?? '') === 'resolved');
    const rejected = data.filter((item) => String(item.status ?? '') === 'rejected');
    const pending = data.filter((item) => String(item.status ?? '') === 'pending');
    const finishedCount = resolved.length + rejected.length;
    const passRate = finishedCount > 0 ? Number(((resolved.length / finishedCount) * 100).toFixed(1)) : 0;

    const handledDurations = data
      .map((item) => {
        const createdAt = Date.parse(String(item.createdAt ?? ''));
        const handledAt = Date.parse(String(item.handledAt ?? ''));

        if (!Number.isFinite(createdAt) || !Number.isFinite(handledAt) || handledAt < createdAt) {
          return null;
        }

        return (handledAt - createdAt) / (1000 * 60);
      })
      .filter((value): value is number => value !== null);

    const avgMinutes =
      handledDurations.length > 0
        ? Number((handledDurations.reduce((sum, value) => sum + value, 0) / handledDurations.length).toFixed(1))
        : 0;

    return {
      passRate,
      avgMinutes,
      pendingCount: pending.length,
    };
  }, [data]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <AuditStats passRate={stats.passRate} avgMinutes={stats.avgMinutes} pendingCount={stats.pendingCount} />
      <Card title="审核历史" loading={loading}>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
        <Table
          rowKey={(record) => String(record.id ?? '')}
          columns={[
            { title: '审核员', dataIndex: 'handledById', render: (value: string) => value || '-' },
            {
              title: '操作',
              dataIndex: 'status',
              render: (value: string) => {
                const status = String(value ?? 'pending');
                if (status === 'resolved') {
                  return <Tag color="green">通过</Tag>;
                }
                if (status === 'rejected') {
                  return <Tag color="red">拒绝</Tag>;
                }
                return <Tag color="default">待处理</Tag>;
              },
            },
            {
              title: '目标',
              render: (_unused: unknown, record: Record<string, unknown>) =>
                `${String(record.targetType ?? '')}#${String(record.targetId ?? '')}`,
            },
            {
              title: '时间',
              render: (_unused: unknown, record: Record<string, unknown>) =>
                String(record.handledAt ?? record.createdAt ?? '-'),
            },
          ]}
          dataSource={data}
        />
      </Card>
    </div>
  );
};

export default AuditHistoryPage;
