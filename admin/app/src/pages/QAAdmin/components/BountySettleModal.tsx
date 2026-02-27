import { InputNumber, Modal, Space, Typography } from 'antd';

interface BountySettleModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
}

export const BountySettleModal = ({ open, onCancel, onOk }: BountySettleModalProps) => (
  <Modal open={open} title="悬赏结算" onCancel={onCancel} onOk={onOk}>
    <Space direction="vertical" style={{ width: '100%' }}>
      <Typography.Text>结算积分</Typography.Text>
      <InputNumber min={0} style={{ width: '100%' }} defaultValue={100} />
    </Space>
  </Modal>
);
