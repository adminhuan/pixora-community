import { Button, Popconfirm, Space, Table, Tag } from 'antd';

export interface BlogRow {
  key: string;
  title: string;
  author: string;
  category: string;
  categoryId: string;
  status: string;
  views: number;
  createdAt: string;
  isRecommended: boolean;
  isBanner: boolean;
}

interface BlogTableProps {
  data: BlogRow[];
  actionLoadingId?: string;
  onToggleRecommend: (record: BlogRow) => Promise<void> | void;
  onToggleBanner: (record: BlogRow) => Promise<void> | void;
  onDelete: (record: BlogRow) => Promise<void> | void;
}

const statusColorMap: Record<string, string> = {
  draft: 'default',
  pending: 'gold',
  published: 'green',
  deleted: 'red',
};

const statusTextMap: Record<string, string> = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  deleted: '已删除',
};

export const BlogTable = ({ data, actionLoadingId, onToggleRecommend, onToggleBanner, onDelete }: BlogTableProps) => (
  <Table<BlogRow>
    rowKey="key"
    columns={[
      { title: '标题', dataIndex: 'title', width: 320 },
      { title: '作者', dataIndex: 'author', width: 120 },
      { title: '分类', dataIndex: 'category', width: 140 },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: (value: string) => <Tag color={statusColorMap[value] ?? 'default'}>{statusTextMap[value] ?? value}</Tag>,
      },
      { title: '阅读量', dataIndex: 'views', width: 100 },
      { title: '时间', dataIndex: 'createdAt', width: 180 },
      {
        title: '操作',
        render: (_unused: unknown, record: BlogRow) => {
          const loading = actionLoadingId === record.key;
          return (
            <Space>
              <Button type="link" loading={loading} disabled={loading} onClick={() => void onToggleRecommend(record)}>
                {record.isRecommended ? '取消推荐' : '设为推荐'}
              </Button>
              <Button type="link" loading={loading} disabled={loading} onClick={() => void onToggleBanner(record)}>
                {record.isBanner ? '取消轮播' : '设为轮播'}
              </Button>
              <Popconfirm
                title="确认删除该文章？"
                okText="确认"
                cancelText="取消"
                onConfirm={() => onDelete(record)}
              >
                <Button type="link" danger loading={loading} disabled={loading}>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ]}
    dataSource={data}
  />
);
