import { useEffect, useState } from 'react';
import { Alert, Card, Table, Button, Space, Tag, message } from 'antd';
import { StarOutlined, FireOutlined } from '@ant-design/icons';
import { adminSnippetApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import dayjs from 'dayjs';

interface SnippetRow {
  key: string;
  title: string;
  author: string;
  category: string;
  framework: string;
  likeCount: number;
  viewCount: number;
  isRecommended: boolean;
  isFeatured: boolean;
  createdAt: string;
}

const ComponentRecommendPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<SnippetRow[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminSnippetApi.list({ type: 'component', limit: 100 });
      const list = extractList<Record<string, unknown>>(response).map((item) => ({
        key: String(item.id ?? ''),
        title: String(item.title ?? ''),
        author: String((item.author as { username?: string } | undefined)?.username ?? '-'),
        category: String(item.category ?? '-'),
        framework: String(item.framework ?? 'css'),
        likeCount: Number(item.likeCount ?? 0),
        viewCount: Number(item.viewCount ?? 0),
        isRecommended: Boolean(item.isRecommended),
        isFeatured: Boolean(item.isFeatured),
        createdAt: String(item.createdAt ?? ''),
      }));
      setData(list.filter((item) => item.key));
    } catch (err) {
      setError(getErrorMessage(err, '数据加载失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleToggleRecommend = async (id: string) => {
    try {
      await adminSnippetApi.recommend(id);
      setData((prev) =>
        prev.map((item) =>
          item.key === id ? { ...item, isRecommended: !item.isRecommended } : item,
        ),
      );
      message.success('操作成功');
    } catch (err) {
      message.error(getErrorMessage(err, '操作失败'));
    }
  };

  const handleToggleFeature = async (id: string) => {
    try {
      await adminSnippetApi.feature(id);
      setData((prev) =>
        prev.map((item) =>
          item.key === id ? { ...item, isFeatured: !item.isFeatured } : item,
        ),
      );
      message.success('操作成功');
    } catch (err) {
      message.error(getErrorMessage(err, '操作失败'));
    }
  };

  const columns = [
    { title: '组件名称', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '作者', dataIndex: 'author', key: 'author', width: 100 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 80 },
    { title: '框架', dataIndex: 'framework', key: 'framework', width: 80 },
    { title: '浏览', dataIndex: 'viewCount', key: 'viewCount', width: 70, sorter: (a: SnippetRow, b: SnippetRow) => a.viewCount - b.viewCount },
    { title: '点赞', dataIndex: 'likeCount', key: 'likeCount', width: 70, sorter: (a: SnippetRow, b: SnippetRow) => a.likeCount - b.likeCount },
    {
      title: '状态', key: 'status', width: 140,
      render: (_: unknown, record: SnippetRow) => (
        <Space size={4}>
          {record.isRecommended && <Tag color="blue">推荐</Tag>}
          {record.isFeatured && <Tag color="gold">精选</Tag>}
        </Space>
      ),
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 140,
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作', key: 'action', width: 180,
      render: (_: unknown, record: SnippetRow) => (
        <Space size={4}>
          <Button
            type={record.isRecommended ? 'primary' : 'default'}
            size="small"
            icon={<StarOutlined />}
            onClick={() => handleToggleRecommend(record.key)}
          >
            {record.isRecommended ? '取消推荐' : '推荐'}
          </Button>
          <Button
            type={record.isFeatured ? 'primary' : 'default'}
            size="small"
            icon={<FireOutlined />}
            onClick={() => handleToggleFeature(record.key)}
          >
            {record.isFeatured ? '取消精选' : '精选'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="推荐/精选管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Table
        columns={columns}
        dataSource={data}
        size="small"
        pagination={{ pageSize: 20 }}
      />
    </Card>
  );
};

export default ComponentRecommendPage;
