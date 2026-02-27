import { Tabs } from 'antd';
import PostManage from './PostManage';
import ReportManagement from '../../components/shared/ReportManagement';

const PostManagePage = () => (
  <Tabs
    items={[
      { key: 'list', label: '帖子列表', children: <PostManage /> },
      { key: 'report', label: '帖子举报', children: <ReportManagement contentType="post" title="帖子举报" /> },
    ]}
  />
);

export default PostManagePage;
