import { Modal, Input, Space, Select } from 'antd';

interface MuteModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
}

export const MuteModal = ({ open, onCancel, onOk }: MuteModalProps) => (
  <Modal open={open} title="禁言用户" onCancel={onCancel} onOk={onOk} okText="确认禁言">
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select
        defaultValue="1d"
        options={[
          { label: '1天', value: '1d' },
          { label: '3天', value: '3d' },
          { label: '7天', value: '7d' },
        ]}
      />
      <Input.TextArea rows={4} placeholder="禁言原因" />
    </Space>
  </Modal>
);
