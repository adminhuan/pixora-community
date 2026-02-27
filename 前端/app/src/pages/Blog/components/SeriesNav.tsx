interface SeriesNavProps {
  series: string[];
}

export const SeriesNav = ({ series }: SeriesNavProps) => (
  <div style={{ display: 'grid', gap: 8 }}>
    <strong>系列目录</strong>
    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
      {series.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);
