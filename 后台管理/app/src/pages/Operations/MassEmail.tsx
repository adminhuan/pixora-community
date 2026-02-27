import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Select, Space, Table } from 'antd';
import { adminOperationsApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { EmailPreview } from './components/EmailPreview';

const MassEmailPage = () => {
  const [segment, setSegment] = useState('all');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);

  const fetchHistory = async () => {
    setHistoryLoading(true);

    try {
      const response = await adminOperationsApi.emailHistory({ limit: 10 });
      setHistory(extractList<Record<string, unknown>>(response));
    } catch (err) {
      setError(getErrorMessage(err, '邮件发送记录加载失败'));
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, []);

  return (
    <Card title="邮件群发">
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} />}
      <Form layout="vertical">
        <Form.Item label="目标用户">
          <Select
            value={segment}
            onChange={setSegment}
            options={[
              { label: '全部用户', value: 'all' },
              { label: '活跃用户', value: 'active' },
              { label: '新用户', value: 'new' }
            ]}
          />
        </Form.Item>
        <Form.Item label="邮件主题">
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
        </Form.Item>
        <Form.Item label="邮件内容">
          <Input.TextArea rows={6} value={content} onChange={(event) => setContent(event.target.value)} />
        </Form.Item>
        <Space>
          <Button
            loading={previewLoading}
            onClick={async () => {
              setPreviewLoading(true);
              setError('');
              setSuccess('');

              try {
                await adminOperationsApi.sendEmail({
                  preview: true,
                  segment,
                  to: 'preview@example.com',
                  subject: `[预览][${segment}] ${subject}`,
                  content
                });
                setSuccess('预览邮件发送成功');
                await fetchHistory();
              } catch (err) {
                setError(getErrorMessage(err, '发送预览失败'));
              } finally {
                setPreviewLoading(false);
              }
            }}
          >
            发送预览
          </Button>
          <Button
            type="primary"
            loading={sending}
            onClick={async () => {
              setSending(true);
              setError('');
              setSuccess('');

              try {
                await adminOperationsApi.sendEmail({
                  preview: false,
                  segment,
                  subject,
                  content
                });
                setSuccess('群发任务已创建');
                await fetchHistory();
              } catch (err) {
                setError(getErrorMessage(err, '群发任务创建失败'));
              } finally {
                setSending(false);
              }
            }}
          >
            立即发送
          </Button>
        </Space>
      </Form>
      <EmailPreview />
      <Table
        style={{ marginTop: 16 }}
        rowKey={(record) => String(record.id ?? '')}
        loading={historyLoading}
        columns={[
          { title: '批次ID', dataIndex: 'batchId' },
          { title: '目标群体', dataIndex: 'segment' },
          { title: '主题', dataIndex: 'subject' },
          { title: '状态', dataIndex: 'status' },
          { title: '发送时间', dataIndex: 'createdAt' }
        ]}
        dataSource={history}
        pagination={false}
      />
    </Card>
  );
};

export default MassEmailPage;
