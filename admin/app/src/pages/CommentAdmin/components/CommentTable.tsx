import { Button, Space, Table } from 'antd';

export interface CommentRow {
  key: string;
  content: string;
  author: string;
  target: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

interface CommentTableProps {
  data: CommentRow[];
  selectedRowKeys: string[];
  deletingId?: string;
  onSelectionChange: (keys: string[]) => void;
  onLocate: (record: CommentRow) => void;
  onDelete: (record: CommentRow) => Promise<void> | void;
}

export const CommentTable = ({
  data,
  selectedRowKeys,
  deletingId = '',
  onSelectionChange,
  onLocate,
  onDelete,
}: CommentTableProps) => (
  <Table<CommentRow>
    rowKey="key"
    rowSelection={{
      selectedRowKeys,
      onChange: (keys) => onSelectionChange(keys.map((item) => String(item))),
    }}
    columns={[
      { title: '评论内容', dataIndex: 'content', width: 420 },
      { title: '作者', dataIndex: 'author', width: 140 },
      { title: '所属内容', dataIndex: 'target', width: 220 },
      { title: '时间', dataIndex: 'createdAt', width: 180 },
      {
        title: '操作',
        width: 160,
        render: (_unused: unknown, record: CommentRow) => (
          <Space>
            <Button type="link" onClick={() => onLocate(record)}>
              定位原文
            </Button>
            <Button type="link" danger loading={deletingId === record.key} onClick={() => onDelete(record)}>
              删除
            </Button>
          </Space>
        ),
      },
    ]}
    dataSource={data}
  />
);
