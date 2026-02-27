import { Button, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export interface UserRecord {
  key: string;
  username: string;
  email: string;
  role: string;
  level: string;
  status: 'active' | 'muted' | 'banned';
  lastLoginIp?: string;
  createdAt: string;
}

interface UserTableProps {
  data: UserRecord[];
  selectedRowKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  onView: (record: UserRecord) => void;
  onBan: (record: UserRecord) => void;
  onMute: (record: UserRecord) => void;
  onBlockIp?: (record: UserRecord) => void;
}

const statusColorMap = {
  active: 'green',
  muted: 'orange',
  banned: 'red',
} as const;

const statusTextMap = {
  active: '正常',
  muted: '禁言',
  banned: '封禁',
} as const;

export const UserTable = ({
  data,
  selectedRowKeys,
  onSelectionChange,
  onView,
  onBan,
  onMute,
  onBlockIp,
}: UserTableProps) => {
  const columns: ColumnsType<UserRecord> = [
    { title: '用户名', dataIndex: 'username' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '角色', dataIndex: 'role' },
    { title: '等级', dataIndex: 'level' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: UserRecord['status']) => <Tag color={statusColorMap[status]}>{statusTextMap[status]}</Tag>,
    },
    {
      title: '最近登录IP',
      dataIndex: 'lastLoginIp',
      render: (ip: string | undefined) => ip || '-',
    },
    { title: '注册时间', dataIndex: 'createdAt' },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => onView(record)}>
            详情
          </Button>
          <Button type="link" onClick={() => onMute(record)}>
            禁言
          </Button>
          <Button type="link" danger onClick={() => onBan(record)}>
            封禁
          </Button>
          {record.lastLoginIp && onBlockIp && (
            <Button type="link" danger onClick={() => onBlockIp(record)}>
              封禁IP
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => onSelectionChange(keys.map((key) => String(key))),
      }}
      columns={columns}
      dataSource={data}
      pagination={{ pageSize: 10 }}
    />
  );
};
