import { Card, Empty } from 'antd';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface GrowthPoint {
  date: string;
  user: number;
  content: number;
}

export const GrowthChart = ({ data = [] }: { data?: GrowthPoint[] }) => (
  <Card title="用户与内容增长趋势（7天）">
    {data.length > 0 ? (
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="user" stroke="#2563EB" fill="#93C5FD" fillOpacity={0.5} />
            <Area type="monotone" dataKey="content" stroke="#1D4ED8" fill="#BFDBFE" fillOpacity={0.4} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <Empty description="暂无增长趋势数据" />
    )}
  </Card>
);
