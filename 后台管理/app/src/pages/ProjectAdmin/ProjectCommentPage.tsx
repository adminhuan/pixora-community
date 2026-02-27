import { Tabs } from 'antd';
import CommentManagement from '../../components/shared/CommentManagement';
import ReportManagement from '../../components/shared/ReportManagement';

const ProjectCommentPage = () => (
  <Tabs
    items={[
      { key: 'list', label: '评论列表', children: <CommentManagement contentType="project" title="项目评论管理" /> },
      { key: 'report', label: '评论举报', children: <ReportManagement contentType="project_comment" title="项目评论举报" /> },
    ]}
  />
);

export default ProjectCommentPage;
