import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Select, Space } from 'antd';

export interface ProjectFilterValue {
  keyword: string;
  categoryId: string;
  status: string;
}

interface ProjectFiltersProps {
  value: ProjectFilterValue;
  categoryOptions: Array<{ label: string; value: string }>;
  loading?: boolean;
  onChange: (patch: Partial<ProjectFilterValue>) => void;
  onSearch: () => void;
  onReset: () => void;
}

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '开发中', value: 'developing' },
  { label: '已完成', value: 'completed' },
  { label: '维护中', value: 'maintained' },
  { label: '已废弃', value: 'deprecated' },
];

export const ProjectFilters = ({
  value,
  categoryOptions,
  loading = false,
  onChange,
  onSearch,
  onReset,
}: ProjectFiltersProps) => (
  <Space wrap style={{ marginBottom: 12 }}>
    <Input
      placeholder="项目名/作者关键词"
      value={value.keyword}
      onChange={(event) => onChange({ keyword: event.target.value })}
      onPressEnter={onSearch}
      allowClear
      style={{ width: 220 }}
    />
    <Select
      style={{ width: 160 }}
      value={value.categoryId}
      options={[{ label: '全部分类', value: 'all' }, ...categoryOptions]}
      onChange={(next) => onChange({ categoryId: next })}
    />
    <Select style={{ width: 140 }} value={value.status} options={statusOptions} onChange={(next) => onChange({ status: next })} />
    <Button type="primary" icon={<SearchOutlined />} onClick={onSearch} loading={loading}>
      筛选
    </Button>
    <Button icon={<ReloadOutlined />} onClick={onReset} disabled={loading}>
      重置
    </Button>
  </Space>
);
