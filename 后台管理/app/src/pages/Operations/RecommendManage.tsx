import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Space, Table } from 'antd';
import { adminOperationsApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

const RecommendManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminOperationsApi.recommendations();
      setData(extractList<Record<string, unknown>>(response));
    } catch (err) {
      setError(getErrorMessage(err, '推荐内容加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRecommendations();
  }, []);

  const sorted = useMemo(() => [...data].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)), [data]);

  return (
    <Card
      title="推荐内容管理"
      loading={loading}
      extra={
        <Button
          type="primary"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            setError('');
            setSuccess('');

            try {
              await adminOperationsApi.updateRecommendations({
                items: sorted.map((item, index) => ({
                  id: String(item.id ?? ''),
                  targetId: String(item.targetId ?? item.id ?? ''),
                  type: String(item.type ?? 'post'),
                  title: String(item.title ?? '-'),
                  order: index + 1
                }))
              });
              setSuccess('推荐位已保存');
              await fetchRecommendations();
            } catch (err) {
              setError(getErrorMessage(err, '推荐位保存失败'));
            } finally {
              setSaving(false);
            }
          }}
        >
          保存推荐位
        </Button>
      }
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} />}
      <Table
        rowKey={(record) => String(record.id ?? '')}
        columns={[
          { title: '类型', dataIndex: 'type' },
          { title: '标题', dataIndex: 'title' },
          { title: '排序', dataIndex: 'order' },
          {
            title: '操作',
            render: (_unused: unknown, record: Record<string, unknown>) => (
              <Space>
                <Button
                  type="link"
                  onClick={async () => {
                    const nextOrder = await openTextInputModal({
                      title: '调整推荐排序',
                      initialValue: String(record.order ?? 1),
                      placeholder: '请输入大于 0 的整数',
                      requiredMessage: '请输入排序值',
                    });
                    if (nextOrder === null) {
                      return;
                    }

                    const parsedOrder = Number(nextOrder);
                    if (!Number.isInteger(parsedOrder) || parsedOrder <= 0) {
                      setError('排序必须是大于 0 的整数');
                      return;
                    }

                    setData((prev) =>
                      prev.map((item) => {
                        if (String(item.id ?? '') !== String(record.id ?? '')) {
                          return item;
                        }

                        return {
                          ...item,
                          order: parsedOrder
                        };
                      })
                    );
                  }}
                >
                  调整排序
                </Button>
              </Space>
            )
          }
        ]}
        dataSource={sorted}
        pagination={false}
      />
    </Card>
  );
};

export default RecommendManagePage;
