import { useMemo } from 'react';
import { Card } from '../../../components/ui';

interface ContributionItem {
  date: string;
  count: number;
}

interface ContributionGraphProps {
  data?: ContributionItem[];
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildGridValues = (data: ContributionItem[]) => {
  const countMap = new Map<string, number>();

  data.forEach((item) => {
    const key = String(item.date ?? '').trim();
    if (!key) {
      return;
    }
    countMap.set(key, Math.max(0, Number(item.count ?? 0)));
  });

  const values: number[] = [];
  const today = new Date();

  for (let offset = 34; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = toDateKey(date);
    const value = countMap.get(key) ?? 0;
    values.push(Math.min(5, value));
  }

  return values;
};

const resolveColor = (value: number) => {
  if (value <= 0) {
    return 'rgba(37,99,235, 0.08)';
  }

  return `rgba(37,99,235, ${Math.min(0.9, 0.18 + value * 0.14)})`;
};

export const ContributionGraph = ({ data = [] }: ContributionGraphProps) => {
  const values = useMemo(() => buildGridValues(data), [data]);

  return (
    <Card title="贡献热力图">
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(7, 16px)', justifyContent: 'start' }}>
          {values.map((value, index) => (
            <div
              key={index}
              title={`贡献值：${value}`}
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: '1px solid var(--color-border)',
                background: resolveColor(value),
              }}
            />
          ))}
        </div>

        <div style={{ color: 'var(--color-textSecondary)', fontSize: 12 }}>
          最近 35 天贡献强度，颜色越深表示当天发布内容越多。
        </div>
      </div>
    </Card>
  );
};
