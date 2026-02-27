import { useMemo, useState } from 'react';
import { Modal, Select } from 'antd';

export interface HandlePayload extends Record<string, unknown> {
  action: string;
  status: 'resolved' | 'rejected';
  result: string;
}

interface HandleReportModalProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onOk: (payload: HandlePayload) => void;
}

const actionOptions = [
  { label: '删除内容', value: 'delete', status: 'resolved', result: '已删除被举报内容' },
  { label: '警告用户', value: 'warn', status: 'resolved', result: '已警告被举报用户' },
  { label: '禁言用户（7天）', value: 'mute', status: 'resolved', result: '已禁言被举报用户（7天）' },
  { label: '封禁用户（30天）', value: 'ban', status: 'resolved', result: '已封禁被举报用户（30天）' },
  { label: '驳回举报', value: 'reject', status: 'rejected', result: '已驳回举报' },
] as const;

export const HandleReportModal = ({ open, loading, onCancel, onOk }: HandleReportModalProps) => {
  const [action, setAction] = useState<string>(actionOptions[0].value);

  const payload = useMemo(() => {
    const selected = actionOptions.find((item) => item.value === action) ?? actionOptions[0];
    return {
      action: selected.value,
      status: selected.status as 'resolved' | 'rejected',
      result: selected.result,
    };
  }, [action]);

  return (
    <Modal
      open={open}
      title="处理举报"
      onCancel={() => {
        setAction(actionOptions[0].value);
        onCancel();
      }}
      confirmLoading={loading}
      onOk={() => {
        onOk(payload);
      }}
      okText="确认处理"
    >
      <Select
        style={{ width: '100%' }}
        value={action}
        options={actionOptions.map((item) => ({ label: item.label, value: item.value }))}
        onChange={(value) => setAction(String(value))}
      />
    </Modal>
  );
};
