import { Tabs } from 'antd';
import ProjectManage from './ProjectManage';
import ReportManagement from '../../components/shared/ReportManagement';

const ProjectListPage = () => (
  <Tabs
    items={[
      { key: 'list', label: '项目列表', children: <ProjectManage /> },
      { key: 'report', label: '项目举报', children: <ReportManagement contentType="project" title="项目举报" /> },
    ]}
  />
);

export default ProjectListPage;
