import type { PropsWithChildren } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  open,
  title = '确认操作',
  children,
  onConfirm,
  onCancel,
}: PropsWithChildren<ConfirmDialogProps>) => {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="button-row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button onClick={onConfirm}>确认</Button>
        </div>
      }
    >
      <div style={{ color: 'var(--color-textSecondary)' }}>{children}</div>
    </Modal>
  );
};
