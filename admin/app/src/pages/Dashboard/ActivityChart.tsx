import { Card, Empty } from 'antd';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ActivityPoint {
  time: string;
  active: number;
}

export const ActivityChart = ({ data = [] }: { data?: ActivityPoint[] }) => (
  <Card title="活跃时段分布">
    {data.length > 0 ? (
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="active" fill="#2563EB" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <Empty description="暂无活跃时段数据" />
    )}
  </Card>
);
