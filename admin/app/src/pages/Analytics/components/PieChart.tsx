import { Card, Empty } from 'antd';
import { PieChart as RChart, Pie, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

interface PiePoint {
  name: string;
  value: number;
}

const colors = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];

export const PieChart = ({ title, data = [] }: { title: string; data?: PiePoint[] }) => {
  const source = data;

  return (
    <Card title={title}>
      {source.length > 0 ? (
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <RChart>
              <Pie data={source} dataKey="value" nameKey="name" outerRadius={88}>
                {source.map((item, index) => (
                  <Cell key={item.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </RChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Empty description="暂无统计数据" />
      )}
    </Card>
  );
};
