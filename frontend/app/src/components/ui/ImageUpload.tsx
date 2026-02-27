import type { ChangeEvent } from 'react';

interface ImageUploadProps {
  onFileChange: (file: File | null) => void;
  multiple?: boolean;
}

export const ImageUpload = ({ onFileChange, multiple }: ImageUploadProps) => {
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileChange(file);
  };

  return (
    <label
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 120,
        borderRadius: 12,
        border: '1px dashed var(--color-primaryLighter)',
        color: 'var(--color-textSecondary)',
        background: 'var(--color-primaryBg)',
        cursor: 'pointer',
      }}
    >
      选择图片文件
      <input type="file" accept="image/*" multiple={multiple} hidden onChange={onChange} />
    </label>
  );
};
