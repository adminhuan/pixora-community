import { Button, Space, Table, Tag } from 'antd';

const columns = [
  { title: '标题', dataIndex: 'title', width: 280 },
  { title: '提问者', dataIndex: 'author' },
  { title: '状态', dataIndex: 'status', render: (value: string) => <Tag color={value === '已解决' ? 'green' : 'blue'}>{value}</Tag> },
  { title: '回答数', dataIndex: 'answers' },
  { title: '投票数', dataIndex: 'votes' },
  { title: '时间', dataIndex: 'createdAt' },
  {
    title: '操作',
    render: () => (
      <Space>
        <Button type="link">关闭</Button>
        <Button type="link">标记重复</Button>
        <Button type="link" danger>
          删除
        </Button>
      </Space>
    ),
  },
];

export const QuestionTable = ({ data }: { data: Array<Record<string, unknown>> }) => (
  <Table rowKey="key" columns={columns} dataSource={data} />
);
