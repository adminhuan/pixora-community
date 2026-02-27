import { useEffect, useState } from 'react';
import { Alert, Button, Card, Space, Table } from 'antd';
import { adminQaApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';

const AnswerManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminQaApi.questions();
      const questions = extractList<Record<string, unknown>>(response);

      const list = questions.flatMap((question) => {
        const answers = Array.isArray(question.answers) ? (question.answers as Array<Record<string, unknown>>) : [];

        return answers.map((answer) => ({
          key: String(answer.id ?? ''),
          question: String(question.title ?? '-'),
          author: String((answer.author as { username?: string } | undefined)?.username ?? '-'),
          votes: Number(answer.voteCount ?? 0),
          isAccepted: Boolean(answer.isAccepted),
          createdAt: String(answer.createdAt ?? '-')
        }));
      });

      setData(list.filter((item) => item.key));
    } catch (err) {
      setError(getErrorMessage(err, '回答数据加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  return (
    <Card title="回答管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="key"
        columns={[
          { title: '所属问题', dataIndex: 'question' },
          { title: '回答者', dataIndex: 'author' },
          { title: '投票', dataIndex: 'votes' },
          {
            title: '最佳回答',
            render: (_unused: unknown, record: Record<string, unknown>) => (record.isAccepted ? '是' : '否')
          },
          { title: '时间', dataIndex: 'createdAt' },
          {
            title: '操作',
            render: (_unused: unknown, record: Record<string, unknown>) => {
              const id = String(record.key ?? '');

              return (
                <Space>
                  <Button
                    type="link"
                    onClick={async () => {
                      if (!id) {
                        return;
                      }

                      try {
                        await adminQaApi.acceptAnswer(id);
                        await fetchData();
                      } catch (err) {
                        setError(getErrorMessage(err, '设置最佳回答失败'));
                      }
                    }}
                  >
                    设为最佳
                  </Button>
                  <Button
                    type="link"
                    danger
                    onClick={async () => {
                      if (!id) {
                        return;
                      }

                      try {
                        await adminQaApi.deleteAnswer(id);
                        await fetchData();
                      } catch (err) {
                        setError(getErrorMessage(err, '删除回答失败'));
                      }
                    }}
                  >
                    删除
                  </Button>
                </Space>
              );
            }
          }
        ]}
        dataSource={data}
        pagination={false}
      />
    </Card>
  );
};

export default AnswerManagePage;
