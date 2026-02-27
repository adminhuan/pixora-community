import { useEffect, useMemo, useState } from 'react';
import { Input, Modal, Select, Space } from 'antd';

interface RejectReasonModalProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onOk: (reason: string) => Promise<void> | void;
}

const reasonOptions = [
  { value: 'ad', label: '广告内容' },
  { value: 'abuse', label: '辱骂攻击' },
  { value: 'illegal', label: '违规信息' },
  { value: 'other', label: '其他原因' },
];

export const RejectReasonModal = ({ open, loading = false, onCancel, onOk }: RejectReasonModalProps) => {
  const [reasonCode, setReasonCode] = useState('ad');
  const [extraText, setExtraText] = useState('');

  useEffect(() => {
    if (open) {
      setReasonCode('ad');
      setExtraText('');
    }
  }, [open]);

  const reasonText = useMemo(() => {
    const base = reasonOptions.find((item) => item.value === reasonCode)?.label ?? '其他原因';
    const detail = extraText.trim();
    return detail ? `${base}：${detail}` : base;
  }, [extraText, reasonCode]);

  return (
    <Modal
      open={open}
      title="审核拒绝原因"
      onCancel={onCancel}
      onOk={() => onOk(reasonText)}
      okText="提交"
      okButtonProps={{ loading }}
      cancelButtonProps={{ disabled: loading }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Select value={reasonCode} onChange={setReasonCode} options={reasonOptions} />
        <Input.TextArea
          rows={4}
          placeholder="补充说明（可选）"
          value={extraText}
          onChange={(event) => setExtraText(event.target.value)}
        />
      </Space>
    </Modal>
  );
};
