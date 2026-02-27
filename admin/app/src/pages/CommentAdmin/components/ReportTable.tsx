import { Button, Space, Table, Tag, Typography } from 'antd';

interface ReportTableProps {
  data: Array<Record<string, unknown>>;
  loading?: boolean;
  selectedId?: string;
  onSelect: (item: Record<string, unknown>) => void;
  onHandle: (item: Record<string, unknown>) => void;
}

const statusColorMap: Record<string, string> = {
  pending: 'orange',
  resolved: 'green',
  rejected: 'red',
};

export const ReportTable = ({ data, loading, selectedId, onSelect, onHandle }: ReportTableProps) => (
  <Table
    rowKey="id"
    size="middle"
    loading={loading}
    pagination={{ pageSize: 10 }}
    onRow={(record) => ({
      onClick: () => onSelect(record as Record<string, unknown>),
      style: { cursor: 'pointer' },
    })}
    rowClassName={(record) => (String(record.id ?? '') === selectedId ? 'ant-table-row-selected' : '')}
    columns={[
      {
        title: '举报对象',
        dataIndex: 'targetSummary',
        render: (_value: unknown, record: Record<string, unknown>) => (
          <div>
            <Typography.Text strong>{String(record.targetSummary ?? '-')}</Typography.Text>
            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>
              {String(record.targetType ?? '')}#{String(record.targetId ?? '')}
            </div>
          </div>
        ),
      },
      {
        title: '所属内容',
        dataIndex: 'source',
        render: (value: unknown) => {
          const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
          return (
            <Typography.Text ellipsis style={{ maxWidth: 180 }}>
              {String(source?.title ?? '-')}
            </Typography.Text>
          );
        },
      },
      { title: '举报原因', dataIndex: 'reasonLabel' },
      {
        title: '举报内容',
        dataIndex: 'description',
        render: (value: unknown) => (
          <Typography.Text ellipsis style={{ maxWidth: 220 }}>
            {String(value ?? '无补充说明')}
          </Typography.Text>
        ),
      },
      {
        title: '举报人',
        dataIndex: 'reporterName',
      },
      {
        title: '被举报用户',
        dataIndex: 'reportedUserName',
      },
      {
        title: '状态',
        dataIndex: 'statusLabel',
        render: (value: unknown, record: Record<string, unknown>) => (
          <Tag color={statusColorMap[String(record.status ?? '')] ?? 'default'}>{String(value ?? '-')}</Tag>
        ),
      },
      { title: '时间', dataIndex: 'createdAtText', width: 180 },
      {
        title: '操作',
        width: 120,
        render: (_value: unknown, record: Record<string, unknown>) => (
          <Space>
            <Button
              type="link"
              onClick={(event) => {
                event.stopPropagation();
                onHandle(record as Record<string, unknown>);
              }}
            >
              处理
            </Button>
          </Space>
        ),
      },
    ]}
    dataSource={data}
  />
);
