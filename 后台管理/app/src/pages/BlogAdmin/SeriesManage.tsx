import { useEffect, useState } from 'react';
import { Alert, Button, Card, Space, Table } from 'antd';
import { adminBlogApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

const SeriesManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchSeries = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminBlogApi.series();
      setData(extractList<Record<string, unknown>>(response));
    } catch (err) {
      setError(getErrorMessage(err, '系列数据加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSeries();
  }, []);

  return (
    <Card title="系列管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Table
        rowKey={(record) => String(record.id ?? '')}
        columns={[
          { title: '系列名称', dataIndex: 'name' },
          { title: '文章数量', dataIndex: 'articleCount' },
          { title: '更新时间', dataIndex: 'updatedAt' },
          {
            title: '操作',
            render: (_unused: unknown, record: Record<string, unknown>) => (
              <Space>
                <Button
                  type="link"
                  onClick={async () => {
                    const id = String(record.id ?? '');
                    if (!id) {
                      return;
                    }

                    const nextName = await openTextInputModal({
                      title: '编辑系列名称',
                      initialValue: String(record.name ?? ''),
                      placeholder: '请输入新的系列名称',
                      requiredMessage: '系列名称不能为空',
                    });
                    if (nextName === null) {
                      return;
                    }

                    try {
                      await adminBlogApi.updateSeries(id, { name: nextName });
                      await fetchSeries();
                    } catch (err) {
                      setError(getErrorMessage(err, '系列更新失败'));
                    }
                  }}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  danger
                  onClick={async () => {
                    const id = String(record.id ?? '');
                    if (!id) {
                      return;
                    }

                    try {
                      await adminBlogApi.deleteSeries(id);
                      await fetchSeries();
                    } catch (err) {
                      setError(getErrorMessage(err, '系列删除失败'));
                    }
                  }}
                >
                  删除
                </Button>
              </Space>
            )
          }
        ]}
        dataSource={data}
        pagination={false}
      />
    </Card>
  );
};

export default SeriesManagePage;
