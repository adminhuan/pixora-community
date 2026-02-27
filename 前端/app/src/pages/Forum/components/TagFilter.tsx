import { TagSelector } from '../../../components/Tag/TagSelector';

interface TagFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
}

export const TagFilter = ({ value, onChange, options }: TagFilterProps) => (
  <TagSelector options={options} value={value} onChange={onChange} max={3} allowCustom={false} placeholder="筛选标签" />
);
