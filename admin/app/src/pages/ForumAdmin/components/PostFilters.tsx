import { Button, DatePicker, Input, Select, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

interface CategoryOption {
  label: string;
  value: string;
}

interface PostFiltersProps {
  keyword: string;
  categoryId: string;
  status: string;
  categoryOptions: CategoryOption[];
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '已发布', value: 'published' },
  { label: '待审核', value: 'pending' },
  { label: '已删除', value: 'deleted' },
];

export const PostFilters = ({
  keyword,
  categoryId,
  status,
  categoryOptions,
  onKeywordChange,
  onCategoryChange,
  onStatusChange,
  onSearch,
  onReset,
}: PostFiltersProps) => (
  <Space wrap style={{ marginBottom: 12 }}>
    <Input
      placeholder="标题/作者关键词"
      style={{ width: 220 }}
      value={keyword}
      onChange={(event) => onKeywordChange(event.target.value)}
      onPressEnter={() => onSearch()}
    />
    <Select
      placeholder="分类"
      style={{ width: 180 }}
      value={categoryId}
      options={categoryOptions}
      onChange={onCategoryChange}
    />
    <Select placeholder="状态" style={{ width: 140 }} value={status} options={statusOptions} onChange={onStatusChange} />
    <DatePicker.RangePicker />
    <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>
      筛选
    </Button>
    <Button icon={<ReloadOutlined />} onClick={onReset}>
      重置
    </Button>
  </Space>
);
