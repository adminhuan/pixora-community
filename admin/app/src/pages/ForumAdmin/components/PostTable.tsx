import { Button, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface PostRecord {
  key: string;
  title: string;
  author: string;
  category: string;
  status: string;
  views: number;
  replies: number;
  createdAt: string;
}

const columns: ColumnsType<PostRecord> = [
  { title: '标题', dataIndex: 'title', width: 280 },
  { title: '作者', dataIndex: 'author' },
  { title: '分类', dataIndex: 'category' },
  { title: '状态', dataIndex: 'status', render: (value: string) => <Tag color="blue">{value}</Tag> },
  { title: '浏览', dataIndex: 'views' },
  { title: '回复', dataIndex: 'replies' },
  { title: '时间', dataIndex: 'createdAt' },
  {
    title: '操作',
    render: () => (
      <Space>
        <Button type="link">置顶</Button>
        <Button type="link">精华</Button>
        <Button type="link">锁定</Button>
        <Button type="link" danger>
          删除
        </Button>
      </Space>
    ),
  },
];

export const PostTable = ({ data }: { data: PostRecord[] }) => <Table rowKey="key" columns={columns} dataSource={data} />;
