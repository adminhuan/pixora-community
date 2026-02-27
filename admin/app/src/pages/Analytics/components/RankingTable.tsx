import { Card, Table } from 'antd';

interface RankRow {
  key: string;
  name: string;
  value: number;
}

export const RankingTable = ({ title, data = [] }: { title: string; data?: RankRow[] }) => (
  <Card title={title}>
    <Table
      rowKey="key"
      columns={[
        { title: '名称', dataIndex: 'name' },
        { title: '数值', dataIndex: 'value' },
      ]}
      dataSource={data}
      pagination={false}
    />
  </Card>
);
