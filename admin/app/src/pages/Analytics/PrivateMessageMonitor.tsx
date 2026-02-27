import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Row, Segmented, Space, Statistic, Table, Tag } from 'antd';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminAnalyticsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';

interface UserCountItem {
  userId: string;
  username: string;
  nickname: string | null;
  avatar: string | null;
  count: number;
}

interface TrendItem {
  date: string;
  total: number;
  read: number;
  unread: number;
}

interface ConversationUser {
  id: string;
  username: string;
  nickname: string | null;
  avatar: string | null;
}

interface ConversationItem {
  conversationId: string;
  messageCount: number;
  unreadCount: number;
  lastMessageAt: string;
  lastMessageContent: string;
  userA: ConversationUser | null;
  userB: ConversationUser | null;
}

interface PrivateMessageSummary {
  totalMessages: number;
  unreadMessages: number;
  totalConversations: number;
  activeUsers: number;
  readRate: number;
  avgMessagesPerConversation: number;
}

interface PrivateMessageAnalyticsData {
  days: number;
  since: string;
  summary: PrivateMessageSummary;
  dailyTrend: TrendItem[];
  topSenders: UserCountItem[];
  topReceivers: UserCountItem[];
  topConversations: ConversationItem[];
  unreadByUser: UserCountItem[];
}

const defaultData: PrivateMessageAnalyticsData = {
  days: 7,
  since: '',
  summary: {
    totalMessages: 0,
    unreadMessages: 0,
    totalConversations: 0,
    activeUsers: 0,
    readRate: 0,
    avgMessagesPerConversation: 0,
  },
  dailyTrend: [],
  topSenders: [],
  topReceivers: [],
  topConversations: [],
  unreadByUser: [],
};

const dayOptions = [
  { label: '近7天', value: 7 },
  { label: '近14天', value: 14 },
  { label: '近30天', value: 30 },
];

const formatDateTime = (value: string) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDisplayName = (record: { username: string; nickname: string | null }) => record.nickname || record.username || '未知用户';

const PrivateMessageMonitorPage = () => {
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<PrivateMessageAnalyticsData>(defaultData);

  const loadData = async (targetDays: number) => {
    setLoading(true);
    setError('');

    try {
      const response = await adminAnalyticsApi.privateMessages({ days: targetDays });
      const payload = extractData<PrivateMessageAnalyticsData>(response, defaultData);
      setData({
        ...defaultData,
        ...payload,
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError, '私信监控数据加载失败'));
      setData(defaultData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(days);
  }, [days]);

  const sinceText = useMemo(() => {
    return formatDateTime(data.since);
  }, [data.since]);

  return (
    <div>
      <div className="module-header">
        <h2>私信监控</h2>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}

      <Card
        style={{ marginBottom: 16 }}
        extra={
          <Space size={8}>
            <Segmented options={dayOptions} value={days} onChange={(value) => setDays(Number(value) || 7)} />
            <Button onClick={() => void loadData(days)} disabled={loading}>
              刷新
            </Button>
          </Space>
        }
      >
        <div style={{ color: '#64748B', fontSize: 13 }}>统计范围起点：{sinceText}</div>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic title="消息总量" value={data.summary.totalMessages} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic title="未读消息" value={data.summary.unreadMessages} valueStyle={{ color: '#DC2626' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic title="会话总数" value={data.summary.totalConversations} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic title="活跃用户" value={data.summary.activeUsers} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic title="已读率" value={data.summary.readRate} suffix="%" precision={2} valueStyle={{ color: '#16A34A' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card loading={loading}>
            <Statistic title="会话均消息" value={data.summary.avgMessagesPerConversation} precision={2} />
          </Card>
        </Col>
      </Row>

      <Card title="私信趋势（按日）" loading={loading} style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data.dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#2563EB" name="总消息" />
            <Bar dataKey="unread" fill="#F97316" name="未读消息" />
            <Line dataKey="read" type="monotone" stroke="#16A34A" strokeWidth={2} dot={false} name="已读消息" />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="高频发送用户 Top10" loading={loading}>
            <Table<UserCountItem>
              rowKey="userId"
              pagination={false}
              dataSource={data.topSenders}
              columns={[
                {
                  title: '用户',
                  dataIndex: 'username',
                  key: 'username',
                  render: (_unused: unknown, record: UserCountItem) => getDisplayName(record),
                },
                {
                  title: '发送量',
                  dataIndex: 'count',
                  key: 'count',
                  width: 120,
                  sorter: (left, right) => left.count - right.count,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="高频接收用户 Top10" loading={loading}>
            <Table<UserCountItem>
              rowKey="userId"
              pagination={false}
              dataSource={data.topReceivers}
              columns={[
                {
                  title: '用户',
                  dataIndex: 'username',
                  key: 'username',
                  render: (_unused: unknown, record: UserCountItem) => getDisplayName(record),
                },
                {
                  title: '接收量',
                  dataIndex: 'count',
                  key: 'count',
                  width: 120,
                  sorter: (left, right) => left.count - right.count,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="高活跃会话 Top10" loading={loading}>
            <Table<ConversationItem>
              rowKey="conversationId"
              dataSource={data.topConversations}
              pagination={false}
              columns={[
                {
                  title: '会话成员',
                  key: 'members',
                  render: (_unused: unknown, record: ConversationItem) => {
                    const userA = record.userA ? getDisplayName(record.userA) : '-';
                    const userB = record.userB ? getDisplayName(record.userB) : '-';
                    return `${userA} / ${userB}`;
                  },
                },
                {
                  title: '消息量',
                  dataIndex: 'messageCount',
                  key: 'messageCount',
                  width: 90,
                },
                {
                  title: '未读',
                  dataIndex: 'unreadCount',
                  key: 'unreadCount',
                  width: 90,
                  render: (value: number) => <Tag color={value > 0 ? 'red' : 'green'}>{value}</Tag>,
                },
                {
                  title: '最后消息',
                  dataIndex: 'lastMessageContent',
                  key: 'lastMessageContent',
                  ellipsis: true,
                },
                {
                  title: '最后活跃',
                  dataIndex: 'lastMessageAt',
                  key: 'lastMessageAt',
                  width: 130,
                  render: (value: string) => formatDateTime(value),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="未读积压用户 Top10" loading={loading}>
            <Table<UserCountItem>
              rowKey="userId"
              pagination={false}
              dataSource={data.unreadByUser}
              columns={[
                {
                  title: '用户',
                  dataIndex: 'username',
                  key: 'username',
                  render: (_unused: unknown, record: UserCountItem) => getDisplayName(record),
                },
                {
                  title: '未读数',
                  dataIndex: 'count',
                  key: 'count',
                  width: 90,
                  render: (value: number) => <Tag color={value > 0 ? 'red' : 'green'}>{value}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PrivateMessageMonitorPage;

