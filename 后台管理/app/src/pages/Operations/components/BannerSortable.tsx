import { List } from 'antd';

interface BannerSortableProps {
  items: Array<string>;
}

export const BannerSortable = ({ items }: BannerSortableProps) => (
  <List
    bordered
    locale={{ emptyText: '暂无 Banner 数据' }}
    dataSource={items}
    renderItem={(item) => <List.Item>{item}</List.Item>}
  />
);
