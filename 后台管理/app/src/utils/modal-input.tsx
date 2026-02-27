import { Input, Modal, message } from 'antd';
import type { ReactNode } from 'react';

interface OpenTextInputModalOptions {
  title: string;
  initialValue?: string;
  placeholder?: string;
  okText?: string;
  required?: boolean;
  requiredMessage?: string;
  trim?: boolean;
  multiline?: boolean;
  rows?: number;
  extraContent?: ReactNode;
  maxLength?: number;
}

export const openTextInputModal = async (options: OpenTextInputModalOptions): Promise<string | null> => {
  return new Promise((resolve) => {
    let value = options.initialValue ?? '';

    Modal.confirm({
      title: options.title,
      icon: null,
      okText: options.okText ?? '确认',
      cancelText: '取消',
      content: (
        <div style={{ display: 'grid', gap: 8 }}>
          {options.extraContent}
          {options.multiline ? (
            <Input.TextArea
              defaultValue={value}
              placeholder={options.placeholder}
              maxLength={options.maxLength}
              autoSize={{ minRows: options.rows ?? 4, maxRows: (options.rows ?? 4) + 4 }}
              onChange={(event) => {
                value = event.target.value;
              }}
            />
          ) : (
            <Input
              defaultValue={value}
              placeholder={options.placeholder}
              maxLength={options.maxLength}
              onChange={(event) => {
                value = event.target.value;
              }}
              onPressEnter={(event) => {
                event.preventDefault();
              }}
            />
          )}
        </div>
      ),
      onOk: async () => {
        const finalValue = options.trim === false ? value : value.trim();
        if (options.required !== false && !finalValue) {
          message.warning(options.requiredMessage ?? '请输入内容');
          return Promise.reject(new Error('EMPTY_INPUT'));
        }

        resolve(finalValue);
      },
      onCancel: () => {
        resolve(null);
      },
    });
  });
};
