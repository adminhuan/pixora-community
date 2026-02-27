import { useEffect, useState } from 'react';
import { Alert, Button, Card, Space, Table, Tag } from 'antd';
import { adminQaApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

const QuestionManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminQaApi.questions();
      setData(extractList<Record<string, unknown>>(response));
    } catch (err) {
      setError(getErrorMessage(err, '问题列表加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchQuestions();
  }, []);

  return (
    <Card title="问题管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Table
        rowKey={(record) => String(record.id ?? '')}
        columns={[
          { title: '标题', dataIndex: 'title', width: 280 },
          {
            title: '提问者',
            render: (_unused: unknown, record: Record<string, unknown>) =>
              String((record.author as { username?: string } | undefined)?.username ?? '-'),
          },
          {
            title: '状态',
            render: (_unused: unknown, record: Record<string, unknown>) => {
              const solved = Boolean(record.isSolved);
              return <Tag color={solved ? 'green' : 'blue'}>{solved ? '已解决' : '未解决'}</Tag>;
            },
          },
          { title: '回答数', dataIndex: 'answerCount' },
          { title: '投票数', dataIndex: 'voteCount' },
          { title: '时间', dataIndex: 'createdAt' },
          {
            title: '操作',
            render: (_unused: unknown, record: Record<string, unknown>) => {
              const id = String(record.id ?? '');

              return (
                <Space>
                  <Button
                    type="link"
                    onClick={async () => {
                      if (!id) return;
                      try {
                        await adminQaApi.closeQuestion(id);
                        await fetchQuestions();
                      } catch (err) {
                        setError(getErrorMessage(err, '问题关闭失败'));
                      }
                    }}
                  >
                    关闭
                  </Button>
                  <Button
                    type="link"
                    onClick={async () => {
                      if (!id) {
                        return;
                      }

                      const duplicateOfId = await openTextInputModal({
                        title: '标记重复问题',
                        placeholder: '请输入重复目标问题 ID',
                        requiredMessage: '目标问题 ID 不能为空',
                      });
                      if (duplicateOfId === null) {
                        return;
                      }

                      try {
                        await adminQaApi.duplicateQuestion(id, { duplicateOfId });
                        await fetchQuestions();
                      } catch (err) {
                        setError(getErrorMessage(err, '标记重复失败'));
                      }
                    }}
                  >
                    标记重复
                  </Button>
                  <Button
                    type="link"
                    danger
                    onClick={async () => {
                      if (!id) return;
                      try {
                        await adminQaApi.deleteQuestion(id);
                        await fetchQuestions();
                      } catch (err) {
                        setError(getErrorMessage(err, '问题删除失败'));
                      }
                    }}
                  >
                    删除
                  </Button>
                </Space>
              );
            },
          },
        ]}
        dataSource={data}
      />
    </Card>
  );
};

export default QuestionManagePage;
