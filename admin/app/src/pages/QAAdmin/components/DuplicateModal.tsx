import { Input, Modal } from 'antd';

interface DuplicateModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
}

export const DuplicateModal = ({ open, onCancel, onOk }: DuplicateModalProps) => (
  <Modal open={open} title="标记重复问题" onCancel={onCancel} onOk={onOk}>
    <Input placeholder="输入原问题 ID 或标题关键词" />
  </Modal>
);
