import { Button, Table } from 'antd';

export const BlacklistTable = ({ data }: { data: Array<Record<string, unknown>> }) => (
  <Table
    rowKey="key"
    columns={[
      { title: '类型', dataIndex: 'type' },
      { title: '值', dataIndex: 'value' },
      { title: '原因', dataIndex: 'reason' },
      { title: '创建时间', dataIndex: 'createdAt' },
      { title: '操作', render: () => <Button type="link" danger>移除</Button> },
    ]}
    dataSource={data}
    pagination={false}
  />
);
