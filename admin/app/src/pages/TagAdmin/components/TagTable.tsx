import { Button, Space, Table } from 'antd';

export const TagTable = ({ data, onMerge }: { data: Array<Record<string, unknown>>; onMerge: () => void }) => (
  <Table
    rowKey="key"
    rowSelection={{}}
    columns={[
      { title: '标签', dataIndex: 'name' },
      { title: '使用次数', dataIndex: 'usage' },
      { title: '创建时间', dataIndex: 'createdAt' },
      {
        title: '操作',
        render: () => (
          <Space>
            <Button type="link">编辑</Button>
            <Button type="link" onClick={onMerge}>
              合并
            </Button>
            <Button type="link" danger>
              删除
            </Button>
          </Space>
        ),
      },
    ]}
    dataSource={data}
  />
);
