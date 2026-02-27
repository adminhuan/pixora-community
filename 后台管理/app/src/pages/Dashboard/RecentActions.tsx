import { Card, Empty, List, Tag } from 'antd';

interface ActionRecord {
  id?: string;
  action?: string;
  operator?: string;
  ip?: string;
  time?: string;
}

export const RecentActions = ({ actions }: { actions?: ActionRecord[] }) => {
  const list = actions ?? [];

  return (
    <Card title="近期操作日志">
      {list.length ? (
        <List
          dataSource={list}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.action ?? '操作'}
                description={
                  <div>
                    <div>{`操作人：${item.operator ?? '-'}`}</div>
                    <div>{`管理员IP：${item.ip ?? '-'}`}</div>
                  </div>
                }
              />
              <Tag color="blue">{item.time ?? '-'}</Tag>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无操作日志" />
      )}
    </Card>
  );
};
