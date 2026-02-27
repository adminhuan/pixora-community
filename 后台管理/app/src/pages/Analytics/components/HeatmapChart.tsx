import { Card } from 'antd';

const defaultValues = Array.from({ length: 42 }, () => 0);

export const HeatmapChart = ({ title, values = defaultValues }: { title: string; values?: number[] }) => {
  const source = values.length ? values : defaultValues;

  return (
    <Card title={title}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4 }}>
        {source.map((value, index) => (
          <div
            key={index}
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: 4,
              background: `rgba(37,99,235,${Math.min(0.15 + Number(value) * 0.08, 1)})`,
            }}
          />
        ))}
      </div>
    </Card>
  );
};
