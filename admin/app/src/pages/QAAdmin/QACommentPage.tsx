import { Tabs } from 'antd';
import CommentManagement from '../../components/shared/CommentManagement';
import ReportManagement from '../../components/shared/ReportManagement';

const QACommentPage = () => (
  <Tabs
    items={[
      { key: 'list', label: '评论列表', children: <CommentManagement contentType="question" title="问答评论管理" /> },
      { key: 'report', label: '评论举报', children: <ReportManagement contentType="question_comment" title="问答评论举报" /> },
    ]}
  />
);

export default QACommentPage;
