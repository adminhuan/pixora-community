import { Button, Form, Input, Modal } from 'antd';

interface SeriesEditorProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
}

export const SeriesEditor = ({ open, onCancel, onOk }: SeriesEditorProps) => (
  <Modal open={open} title="编辑系列" onCancel={onCancel} footer={null}>
    <Form layout="vertical" onFinish={onOk}>
      <Form.Item label="系列名称" name="name" initialValue="数据库优化实战">
        <Input />
      </Form.Item>
      <Form.Item label="简介" name="description" initialValue="聚焦 PostgreSQL 与 Redis 优化">
        <Input.TextArea rows={4} />
      </Form.Item>
      <Button type="primary" htmlType="submit">
        保存
      </Button>
    </Form>
  </Modal>
);
