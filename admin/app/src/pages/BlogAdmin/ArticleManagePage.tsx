import { Tabs } from 'antd';
import BlogManage from './BlogManage';
import ReportManagement from '../../components/shared/ReportManagement';

const ArticleManagePage = () => (
  <Tabs
    items={[
      { key: 'list', label: '文章列表', children: <BlogManage /> },
      { key: 'report', label: '文章举报', children: <ReportManagement contentType="blog" title="文章举报" /> },
    ]}
  />
);

export default ArticleManagePage;
