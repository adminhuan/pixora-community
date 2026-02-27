import { Select } from 'antd';

interface RoleSelectProps {
  value?: string;
  onChange?: (value: string) => void;
}

export const RoleSelect = ({ value, onChange }: RoleSelectProps) => (
  <Select
    value={value}
    onChange={onChange}
    style={{ width: 120 }}
    options={[
      { label: '普通用户', value: 'user' },
      { label: '版主', value: 'moderator' },
      { label: '管理员', value: 'admin' },
    ]}
  />
);
