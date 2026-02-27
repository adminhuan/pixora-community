import { Modal, Select, Space } from 'antd';

interface MergeTagModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
}

export const MergeTagModal = ({ open, onCancel, onOk }: MergeTagModalProps) => (
  <Modal open={open} title="合并标签" onCancel={onCancel} onOk={onOk} okText="确认合并">
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select mode="multiple" placeholder="选择待合并标签" options={[{ value: 'mysql' }, { value: 'MySQL' }, { value: 'my-sql' }]} />
      <Select placeholder="选择目标标签" options={[{ value: 'MySQL' }, { value: 'PostgreSQL' }]} />
    </Space>
  </Modal>
);
