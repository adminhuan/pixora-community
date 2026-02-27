interface ReadingProgressProps {
  progress: number;
}

export const ReadingProgress = ({ progress }: ReadingProgressProps) => (
  <div
    style={{
      position: 'sticky',
      top: 64,
      width: '100%',
      height: 4,
      borderRadius: 4,
      background: 'var(--color-border)',
      overflow: 'hidden',
      zIndex: 10,
    }}
  >
    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)' }} />
  </div>
);
