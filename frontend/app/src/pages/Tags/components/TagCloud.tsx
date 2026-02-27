interface TagCloudProps {
  tags: Array<{ name: string; heat: number }>;
}

export const TagCloud = ({ tags }: TagCloudProps) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
    {tags.map((tag) => (
      <span
        key={tag.name}
        style={{
          fontSize: 12 + tag.heat * 2,
          color: 'var(--color-primaryDark)',
          borderRadius: 999,
          padding: '4px 10px',
          background: 'var(--color-primaryBg)',
        }}
      >
        {tag.name}
      </span>
    ))}
  </div>
);
