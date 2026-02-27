import { Card, Empty } from 'antd';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ContentPoint {
  name: string;
  value: number;
}

const colors = ['#2563EB', '#3B82F6', '#60A5FA', '#1D4ED8', '#93C5FD'];

export const ContentPieChart = ({ data = [] }: { data?: ContentPoint[] }) => {
  const source = data;

  return (
    <Card title="内容占比">
      {source.length > 0 ? (
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={source} dataKey="value" nameKey="name" outerRadius={90}>
                {source.map((item, index) => (
                  <Cell key={item.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Empty description="暂无内容统计数据" />
      )}
    </Card>
  );
};
