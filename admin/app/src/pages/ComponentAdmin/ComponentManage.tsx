import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Card, Table, Button, Space, Input, Select, Popconfirm, Tag, message } from 'antd';
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

const ComponentManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<SnippetRow[]>([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { type: 'component', limit: 50 };
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;
      const response = await adminSnippetApi.list(params);
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
      setError(getErrorMessage(err, '组件数据加载失败'));
    } finally {
      setLoading(false);
    }
  }, [category, keyword]);

  const categoryOptions = useMemo(() => {
    const labels: Record<string, string> = {
      buttons: '按钮',
      cards: '卡片',
      loaders: '加载器',
      inputs: '输入框',
      toggles: '开关',
      forms: '表单',
      alerts: '提示框',
      other: '其他',
    };

    const set = new Set<string>();
    data.forEach((item) => {
      if (item.category) {
        set.add(item.category);
      }
    });

    return Array.from(set).map((value) => ({
      value,
      label: labels[value] ?? value,
    }));
  }, [data]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await adminSnippetApi.deleteSnippet(id);
      message.success('删除成功');
      setData((prev) => prev.filter((item) => item.key !== id));
    } catch (err) {
      message.error(getErrorMessage(err, '删除失败'));
    }
  };

  const columns = [
    { title: '组件名称', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '作者', dataIndex: 'author', key: 'author', width: 100 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 80 },
    { title: '框架', dataIndex: 'framework', key: 'framework', width: 80 },
    {
      title: '状态', key: 'status', width: 140,
      render: (_: unknown, record: SnippetRow) => (
        <Space size={4}>
          {record.isRecommended && <Tag color="blue">推荐</Tag>}
          {record.isFeatured && <Tag color="gold">精选</Tag>}
        </Space>
      ),
    },
    { title: '浏览', dataIndex: 'viewCount', key: 'viewCount', width: 70 },
    { title: '点赞', dataIndex: 'likeCount', key: 'likeCount', width: 70 },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 140,
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: unknown, record: SnippetRow) => (
        <Popconfirm title="确定删除该组件？" onConfirm={() => handleDelete(record.key)}>
          <Button type="link" danger size="small">删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card title="组件管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索组件名称"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={() => void fetchData()}
          style={{ width: 200 }}
          allowClear
        />
        <Select
          placeholder="选择分类"
          value={category || undefined}
          onChange={(val) => setCategory(val ?? '')}
          style={{ width: 120 }}
          allowClear
          options={categoryOptions}
        />
        <Button type="primary" onClick={() => void fetchData()}>筛选</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        size="small"
        pagination={{ pageSize: 20 }}
      />
    </Card>
  );
};

export default ComponentManagePage;
