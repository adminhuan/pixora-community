import { Card, Empty } from 'antd';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface TrendPoint {
  date: string;
  usage: number;
  followers: number;
}

export const TagTrendChart = ({ data = [] }: { data?: TrendPoint[] }) => (
  <Card title="标签趋势">
    {data.length > 0 ? (
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="usage" stroke="#2563EB" strokeWidth={2} />
            <Line type="monotone" dataKey="followers" stroke="#1D4ED8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <Empty description="暂无标签趋势数据" />
    )}
  </Card>
);
