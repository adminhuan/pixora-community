import { Tabs } from 'antd';
import CommentManagement from '../../components/shared/CommentManagement';
import ReportManagement from '../../components/shared/ReportManagement';

const ForumCommentPage = () => (
  <Tabs
    items={[
      { key: 'list', label: '评论列表', children: <CommentManagement contentType="post" title="论坛评论管理" /> },
      { key: 'report', label: '评论举报', children: <ReportManagement contentType="post_comment" title="论坛评论举报" /> },
    ]}
  />
);

export default ForumCommentPage;
