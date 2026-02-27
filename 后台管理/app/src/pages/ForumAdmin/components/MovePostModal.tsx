import { Modal, Select } from 'antd';

interface CategoryOption {
  label: string;
  value: string;
}

interface MovePostModalProps {
  open: boolean;
  value: string;
  loading?: boolean;
  onCancel: () => void;
  onOk: () => void;
  onChange: (value: string) => void;
  categoryOptions: CategoryOption[];
}

export const MovePostModal = ({
  open,
  value,
  loading = false,
  onCancel,
  onOk,
  onChange,
  categoryOptions,
}: MovePostModalProps) => (
  <Modal
    open={open}
    title="移动帖子"
    onCancel={onCancel}
    onOk={onOk}
    okText="确认移动"
    cancelText="取消"
    confirmLoading={loading}
    okButtonProps={{ disabled: !value }}
  >
    <Select
      style={{ width: '100%' }}
      placeholder="选择目标分类"
      value={value || undefined}
      options={categoryOptions}
      onChange={onChange}
    />
  </Modal>
);
