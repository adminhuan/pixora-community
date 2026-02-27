import { Card, Empty } from 'antd';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface TrendPoint {
  date: string;
  value: number;
}

export const TrendChart = ({ title, data = [] }: { title: string; data?: TrendPoint[] }) => (
  <Card title={title}>
    {data.length > 0 ? (
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <Empty description="暂无趋势数据" />
    )}
  </Card>
);
