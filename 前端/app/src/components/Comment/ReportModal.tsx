import { useState } from 'react';
import { Button, Modal } from '../ui';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const ReportModal = ({ open, onClose, onSubmit }: ReportModalProps) => {
  const [reason, setReason] = useState('');

  return (
    <Modal
      open={open}
      title="举报评论"
      onClose={onClose}
      footer={
        <div className="button-row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={() => onSubmit(reason)}>提交</Button>
        </div>
      }
    >
      <textarea
        className="textarea"
        rows={4}
        placeholder="请填写举报原因"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
    </Modal>
  );
};
