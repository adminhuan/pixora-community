import { Tabs } from 'antd';
import QuestionManage from './QuestionManage';
import ReportManagement from '../../components/shared/ReportManagement';

const QuestionManagePage = () => (
  <Tabs
    items={[
      { key: 'list', label: '问题列表', children: <QuestionManage /> },
      { key: 'report', label: '问题举报', children: <ReportManagement contentType="question" title="问题举报" /> },
    ]}
  />
);

export default QuestionManagePage;
