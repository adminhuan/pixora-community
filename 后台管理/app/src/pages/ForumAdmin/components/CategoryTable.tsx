import { Button, Space, Switch, Table } from 'antd';

export interface CategoryRow {
  key: string;
  name: string;
  sort: number;
  enabled: boolean;
}

interface CategoryTableProps {
  data: CategoryRow[];
  loading?: boolean;
  onToggleEnabled?: (row: CategoryRow, enabled: boolean) => void;
  onEdit?: (row: CategoryRow) => void;
  onDelete?: (row: CategoryRow) => void;
}

export const CategoryTable = ({
  data,
  loading = false,
  onToggleEnabled,
  onEdit,
  onDelete,
}: CategoryTableProps) => (
  <Table
    rowKey="key"
    loading={loading}
    locale={{ emptyText: '暂无分类数据' }}
    columns={[
      { title: '分类', dataIndex: 'name' },
      { title: '排序', dataIndex: 'sort' },
      {
        title: '启用',
        dataIndex: 'enabled',
        render: (value: boolean, row: CategoryRow) => (
          <Switch
            checked={value}
            onChange={(nextValue) => {
              if (onToggleEnabled) {
                onToggleEnabled(row, nextValue);
              }
            }}
          />
        ),
      },
      {
        title: '操作',
        render: (_unused: unknown, row: CategoryRow) => (
          <Space>
            <Button type="link" onClick={() => onEdit?.(row)}>
              编辑
            </Button>
            <Button type="link" danger onClick={() => onDelete?.(row)}>
              删除
            </Button>
          </Space>
        ),
      },
    ]}
    dataSource={data}
    pagination={false}
  />
);
