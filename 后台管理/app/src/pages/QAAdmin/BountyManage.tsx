import { useEffect, useState } from 'react';
import { Alert, Button, Card, Space, Table } from 'antd';
import { adminQaApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';

const BountyManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminQaApi.bounties();
      const list = extractList<Record<string, unknown>>(response).map((item) => ({
        key: String(item.id ?? ''),
        question: String(item.title ?? '-'),
        amount: Number(item.bounty ?? 0),
        expireAt: String(item.bountyExpiresAt ?? '-'),
        status: item.isSolved === true ? '已完成' : '进行中'
      }));

      setData(list);
    } catch (err) {
      setError(getErrorMessage(err, '悬赏数据加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  return (
    <Card title="悬赏管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {info && <Alert type="info" showIcon message={info} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="key"
        columns={[
          { title: '问题', dataIndex: 'question' },
          { title: '悬赏积分', dataIndex: 'amount' },
          { title: '截止时间', dataIndex: 'expireAt' },
          { title: '状态', dataIndex: 'status' },
          {
            title: '操作',
            render: (_unused: unknown, record: Record<string, unknown>) => (
              <Space>
                <Button
                  type="link"
                  onClick={async () => {
                    const id = String(record.key ?? '');
                    if (!id) {
                      return;
                    }

                    try {
                      await adminQaApi.settleBounty(id, {});
                      setInfo('悬赏已结算');
                      await fetchData();
                    } catch (err) {
                      setError(getErrorMessage(err, '悬赏结算失败'));
                    }
                  }}
                >
                  结算
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

export default BountyManagePage;
