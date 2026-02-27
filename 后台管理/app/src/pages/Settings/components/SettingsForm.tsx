import type { ReactNode } from 'react';
import { Button, Card, Form, Space } from 'antd';

interface SettingsFormProps {
  title: string;
  children: ReactNode;
  extra?: ReactNode;
}

export const SettingsForm = ({ title, children, extra }: SettingsFormProps) => (
  <Card title={title} extra={extra}>
    <Form layout="vertical">
      <Space direction="vertical" style={{ width: '100%' }}>
        {children}
        <Button type="primary">保存配置</Button>
      </Space>
    </Form>
  </Card>
);
