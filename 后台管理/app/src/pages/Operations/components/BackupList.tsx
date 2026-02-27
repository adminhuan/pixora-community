import { Button, Space, Table } from 'antd';

export const BackupList = ({ data }: { data: Array<Record<string, unknown>> }) => (
  <Table
    rowKey="key"
    columns={[
      { title: '备份文件', dataIndex: 'name' },
      { title: '大小', dataIndex: 'size' },
      { title: '创建时间', dataIndex: 'createdAt' },
      {
        title: '操作',
        render: () => (
          <Space>
            <Button type="link">下载</Button>
            <Button type="link" danger>
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
