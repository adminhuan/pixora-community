import { Switch, Typography } from 'antd';

interface ToggleSwitchProps {
  label: string;
  defaultChecked?: boolean;
}

export const ToggleSwitch = ({ label, defaultChecked = false }: ToggleSwitchProps) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
    <Typography.Text>{label}</Typography.Text>
    <Switch defaultChecked={defaultChecked} />
  </div>
);
