import { useState } from 'react';
import { Button } from '../ui';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<boolean> | boolean;
  placeholder?: string;
  submitText?: string;
  onCancel?: () => void;
}

export const CommentInput = ({
  onSubmit,
  placeholder = '输入评论内容',
  submitText = '发布评论',
  onCancel,
}: CommentInputProps) => {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const ok = await onSubmit(value.trim());
      if (ok) {
        setValue('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <textarea
        className="textarea"
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="button-row" style={{ justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>最多 500 字</span>
        <div className="button-row">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={submitting}>
              取消回复
            </Button>
          )}
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? '提交中...' : submitText}
          </Button>
        </div>
      </div>
    </div>
  );
};
