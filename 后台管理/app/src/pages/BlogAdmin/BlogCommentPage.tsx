import { Tabs } from 'antd';
import CommentManagement from '../../components/shared/CommentManagement';
import ReportManagement from '../../components/shared/ReportManagement';

const BlogCommentPage = () => (
  <Tabs
    items={[
      { key: 'list', label: '评论列表', children: <CommentManagement contentType="blog" title="博客评论管理" /> },
      { key: 'report', label: '评论举报', children: <ReportManagement contentType="blog_comment" title="博客评论举报" /> },
    ]}
  />
);

export default BlogCommentPage;
