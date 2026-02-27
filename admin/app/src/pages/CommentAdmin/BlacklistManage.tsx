import { useEffect, useState } from 'react';
import { Alert, Button, Card, Input, Space, Table } from 'antd';
import { adminCommentApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';

const BlacklistManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchBlacklist = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminCommentApi.blacklist();
      setData(extractList<Record<string, unknown>>(response));
    } catch (err) {
      setError(getErrorMessage(err, '黑名单加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBlacklist();
  }, []);

  return (
    <Card title="黑名单管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Space style={{ marginBottom: 12 }}>
        <Input placeholder="IP 或设备标识" style={{ width: 220 }} value={value} onChange={(event) => setValue(event.target.value)} />
        <Input placeholder="原因" style={{ width: 220 }} value={reason} onChange={(event) => setReason(event.target.value)} />
        <Button
          type="primary"
          loading={submitting}
          onClick={async () => {
            const target = value.trim();
            if (!target) {
              return;
            }

            setSubmitting(true);
            setError('');

            try {
              await adminCommentApi.addBlacklist({ value: target, reason: reason.trim(), type: 'custom' });
              setValue('');
              setReason('');
              await fetchBlacklist();
            } catch (err) {
              setError(getErrorMessage(err, '添加黑名单失败'));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          添加黑名单
        </Button>
      </Space>
      <Table
        rowKey={(record) => String(record.id ?? '')}
        columns={[
          { title: '类型', dataIndex: 'type', render: (value: string) => value || 'custom' },
          { title: '值', dataIndex: 'value' },
          { title: '原因', dataIndex: 'reason' },
          { title: '创建时间', dataIndex: 'createdAt' },
          {
            title: '操作',
            render: (_unused: unknown, record: Record<string, unknown>) => (
              <Button
                type="link"
                danger
                onClick={async () => {
                  const id = String(record.id ?? '');
                  if (!id) {
                    return;
                  }

                  try {
                    await adminCommentApi.removeBlacklist(id);
                    await fetchBlacklist();
                  } catch (err) {
                    setError(getErrorMessage(err, '移除黑名单失败'));
                  }
                }}
              >
                移除
              </Button>
            ),
          },
        ]}
        dataSource={data}
        pagination={false}
      />
    </Card>
  );
};

export default BlacklistManagePage;
