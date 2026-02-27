import { DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Select, Space } from 'antd';

export interface UserFilterValue {
  keyword: string;
  status: 'all' | 'active' | 'muted' | 'banned';
}

interface UserFiltersProps {
  value: UserFilterValue;
  loading?: boolean;
  onChange: (patch: Partial<UserFilterValue>) => void;
  onSearch: () => void;
  onReset: () => void;
  onExport: () => void;
}

export const UserFilters = ({ value, loading = false, onChange, onSearch, onReset, onExport }: UserFiltersProps) => (
  <Card size="small" style={{ marginBottom: 12 }}>
    <Space wrap>
      <Input
        placeholder="用户名/邮箱"
        value={value.keyword}
        onChange={(event) => onChange({ keyword: event.target.value })}
        onPressEnter={onSearch}
        style={{ width: 220 }}
        allowClear
      />
      <Select
        value={value.status}
        style={{ width: 120 }}
        onChange={(next) => onChange({ status: next })}
        options={[
          { label: '全部状态', value: 'all' },
          { label: '正常', value: 'active' },
          { label: '禁言', value: 'muted' },
          { label: '封禁', value: 'banned' },
        ]}
      />
      <Button type="primary" icon={<SearchOutlined />} loading={loading} onClick={onSearch}>
        查询
      </Button>
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={loading}>
        重置
      </Button>
      <Button icon={<DownloadOutlined />} onClick={onExport} disabled={loading}>
        导出 CSV
      </Button>
    </Space>
  </Card>
);
