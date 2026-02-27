import { Card } from 'antd';

interface FunnelStep {
  name: string;
  value: number;
}

const defaultSteps: FunnelStep[] = [
  { name: '访问', value: 0 },
  { name: '注册', value: 0 },
  { name: '留存', value: 0 },
];

export const FunnelChart = ({ title, steps = defaultSteps }: { title: string; steps?: FunnelStep[] }) => {
  const source = steps.length ? steps : defaultSteps;

  return (
    <Card title={title}>
      <div style={{ display: 'grid', gap: 10 }}>
        {source.map((step, index) => (
          <div
            key={step.name}
            style={{
              width: `${Math.max(100 - index * 18, 36)}%`,
              background: 'linear-gradient(120deg, rgba(37,99,235,0.18), rgba(59,130,246,0.06))',
              border: '1px solid #BFDBFE',
              borderRadius: 8,
              padding: '8px 12px',
            }}
          >
            {step.name}：{step.value}
          </div>
        ))}
      </div>
    </Card>
  );
};
