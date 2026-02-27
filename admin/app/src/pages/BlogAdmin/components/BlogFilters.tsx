import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Select, Space } from 'antd';

export interface BlogFilterValue {
  keyword: string;
  categoryId: string;
  status: string;
}

interface BlogFiltersProps {
  value: BlogFilterValue;
  categoryOptions: Array<{ label: string; value: string }>;
  loading?: boolean;
  onChange: (patch: Partial<BlogFilterValue>) => void;
  onSearch: () => void;
  onReset: () => void;
}

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '待审核', value: 'pending' },
  { label: '已发布', value: 'published' },
  { label: '已删除', value: 'deleted' },
];

export const BlogFilters = ({ value, categoryOptions, loading = false, onChange, onSearch, onReset }: BlogFiltersProps) => (
  <Space wrap style={{ marginBottom: 12 }}>
    <Input
      placeholder="标题/作者关键词"
      value={value.keyword}
      onChange={(event) => onChange({ keyword: event.target.value })}
      onPressEnter={onSearch}
      allowClear
      style={{ width: 220 }}
    />
    <Select
      style={{ width: 170 }}
      value={value.categoryId}
      options={[{ label: '全部分类', value: 'all' }, ...categoryOptions]}
      onChange={(next) => onChange({ categoryId: next })}
    />
    <Select
      style={{ width: 150 }}
      value={value.status}
      options={statusOptions}
      onChange={(next) => onChange({ status: next })}
    />
    <Button type="primary" icon={<SearchOutlined />} onClick={onSearch} loading={loading}>
      筛选
    </Button>
    <Button icon={<ReloadOutlined />} onClick={onReset} disabled={loading}>
      重置
    </Button>
  </Space>
);
