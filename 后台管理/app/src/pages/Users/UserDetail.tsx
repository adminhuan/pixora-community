import { useEffect, useState } from 'react';
import { Alert, Card, Col, Descriptions, Row, Table } from 'antd';
import { adminOperationsApi, adminUserApi } from '../../api/admin';
import { extractData, extractList, getErrorMessage } from '../../utils/api';

const UserDetailPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');

      try {
        const listRes = await adminUserApi.list({ page: 1, limit: 1 });
        const users = extractList<Record<string, unknown>>(listRes);
        const firstId = String(users[0]?.id ?? '');

        if (!firstId) {
          setDetail(null);
          setLogs([]);
          return;
        }

        const [detailRes, logsRes] = await Promise.all([adminUserApi.detail(firstId), adminOperationsApi.logs()]);
        const user = extractData<Record<string, unknown> | null>(detailRes, null);
        const logList = extractList<Record<string, unknown>>(logsRes).slice(0, 8).map((item, index) => ({
          key: String(item.id ?? index),
          action: String(item.action ?? '-'),
          time: String(item.createdAt ?? '-'),
          ip: String(item.ip ?? '-'),
        }));

        setDetail(user);
        setLogs(logList);
      } catch (err) {
        setError(getErrorMessage(err, '用户详情加载失败'));
        setDetail(null);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, []);

  return (
    <Row gutter={[12, 12]}>
      <Col span={24}>
        <Card title="用户详情" loading={loading}>
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
          <Descriptions column={3}>
            <Descriptions.Item label="用户名">{String(detail?.username ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{String(detail?.email ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="角色">{String(detail?.role ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="注册时间">{String(detail?.createdAt ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="积分">{Number(detail?.points ?? 0)}</Descriptions.Item>
            <Descriptions.Item label="等级">{`Lv.${Number(detail?.level ?? 1)}`}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="操作日志" loading={loading}>
          <Table
            rowKey="key"
            columns={[
              { title: '行为', dataIndex: 'action' },
              { title: '时间', dataIndex: 'time' },
              { title: 'IP', dataIndex: 'ip' },
            ]}
            dataSource={logs}
            pagination={false}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default UserDetailPage;
