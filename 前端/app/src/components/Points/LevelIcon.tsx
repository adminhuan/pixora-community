interface LevelIconProps {
  level: string;
}

export const LevelIcon = ({ level }: LevelIconProps) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 999,
      padding: '2px 8px',
      fontSize: 12,
      border: '1px solid var(--color-primaryLighter)',
      color: 'var(--color-primaryDark)',
    }}
  >
    {level}
  </span>
);
