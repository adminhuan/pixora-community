import { Table } from 'antd';

export const LogTable = ({ data }: { data: Array<Record<string, unknown>> }) => (
  <Table
    rowKey="key"
    columns={[
      { title: '操作人', dataIndex: 'operator' },
      { title: '操作类型', dataIndex: 'action' },
      { title: '目标', dataIndex: 'target' },
      { title: '状态码', dataIndex: 'statusCode' },
      { title: '耗时(ms)', dataIndex: 'durationMs' },
      { title: '时间', dataIndex: 'time' },
    ]}
    dataSource={data}
  />
);
