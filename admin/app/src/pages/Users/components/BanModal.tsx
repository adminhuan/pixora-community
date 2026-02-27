import { Modal, Input, Space, Select } from 'antd';

interface BanModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
}

export const BanModal = ({ open, onCancel, onOk }: BanModalProps) => (
  <Modal open={open} title="封禁用户" onCancel={onCancel} onOk={onOk} okText="确认封禁">
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select
        defaultValue="7d"
        options={[
          { label: '7天', value: '7d' },
          { label: '30天', value: '30d' },
          { label: '永久', value: 'permanent' },
        ]}
      />
      <Input.TextArea rows={4} placeholder="封禁原因" />
    </Space>
  </Modal>
);
