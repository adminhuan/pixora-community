import { Button, Popconfirm, Select, Space, Table, Tag } from 'antd';

export interface ProjectRow {
  key: string;
  name: string;
  author: string;
  stack: string[];
  status: string;
  stars: number;
  coverImage: string;
  categoryId: string;
  category: string;
  description: string;
  demoUrl: string;
  sourceUrl: string;
  createdAt: string;
}

interface ProjectTableProps {
  data: ProjectRow[];
  actionLoadingId?: string;
  onStatusChange: (record: ProjectRow, status: string) => Promise<void> | void;
  onDelete: (record: ProjectRow) => Promise<void> | void;
  onPreview: (record: ProjectRow) => void;
}

const statusOptions = [
  { label: '开发中', value: 'developing' },
  { label: '已完成', value: 'completed' },
  { label: '维护中', value: 'maintained' },
  { label: '已废弃', value: 'deprecated' },
];

const statusColorMap: Record<string, string> = {
  developing: 'processing',
  completed: 'success',
  maintained: 'blue',
  deprecated: 'default',
};

const statusTextMap: Record<string, string> = {
  developing: '开发中',
  completed: '已完成',
  maintained: '维护中',
  deprecated: '已废弃',
};

export const ProjectTable = ({ data, actionLoadingId, onStatusChange, onDelete, onPreview }: ProjectTableProps) => (
  <Table<ProjectRow>
    rowKey="key"
    columns={[
      {
        title: '项目封面',
        dataIndex: 'coverImage',
        width: 120,
        render: (coverImage: string, record: ProjectRow) =>
          coverImage ? (
            <img
              src={coverImage}
              alt={record.name}
              style={{ width: 88, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #d9e1ec' }}
            />
          ) : (
            <span style={{ color: '#64748b' }}>未上传</span>
          ),
      },
      { title: '项目名称', dataIndex: 'name', width: 220 },
      { title: '作者', dataIndex: 'author', width: 120 },
      {
        title: '技术栈',
        dataIndex: 'stack',
        width: 220,
        render: (value: string[]) => (
          <Space wrap>
            {(value || []).slice(0, 4).map((item) => (
              <Tag key={item} color="blue">
                {item}
              </Tag>
            ))}
          </Space>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 180,
        render: (status: string, record: ProjectRow) => (
          <Space>
            <Tag color={statusColorMap[status] ?? 'default'}>{statusTextMap[status] ?? status}</Tag>
            <Select
              size="small"
              value={record.status}
              style={{ width: 100 }}
              options={statusOptions}
              onChange={(nextStatus) => void onStatusChange(record, nextStatus)}
              disabled={actionLoadingId === record.key}
            />
          </Space>
        ),
      },
      { title: '星标数', dataIndex: 'stars', width: 100 },
      {
        title: '操作',
        width: 170,
        render: (_unused: unknown, record: ProjectRow) => (
          <Space>
            <Button type="link" onClick={() => onPreview(record)}>
              查看
            </Button>
            <Popconfirm title="确认删除该项目？" okText="确认" cancelText="取消" onConfirm={() => onDelete(record)}>
              <Button type="link" danger loading={actionLoadingId === record.key}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ]}
    dataSource={data}
    scroll={{ x: 1180 }}
  />
);
