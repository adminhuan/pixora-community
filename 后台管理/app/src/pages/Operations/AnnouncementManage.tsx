import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Space, Table } from 'antd';
import { adminOperationsApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

const AnnouncementManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('system');
  const [content, setContent] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminOperationsApi.announcements();
      setData(extractList<Record<string, unknown>>(response));
    } catch (err) {
      setError(getErrorMessage(err, '公告列表加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAnnouncements();
  }, []);

  return (
    <Card title="公告管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Form layout="vertical">
        <Form.Item label="公告标题">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Form.Item>
        <Form.Item label="公告类型">
          <Input value={type} onChange={(event) => setType(event.target.value)} placeholder="system/event/release" />
        </Form.Item>
        <Form.Item label="公告内容">
          <Input.TextArea rows={4} value={content} onChange={(event) => setContent(event.target.value)} />
        </Form.Item>
        <Button
          type="primary"
          loading={submitting}
          onClick={async () => {
            if (!title.trim()) {
              return;
            }

            setSubmitting(true);
            setError('');

            try {
              await adminOperationsApi.createAnnouncement({ title: title.trim(), type: type.trim(), content: content.trim() });
              setTitle('');
              setContent('');
              await fetchAnnouncements();
            } catch (err) {
              setError(getErrorMessage(err, '发布公告失败'));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          发布公告
        </Button>
      </Form>
      <Table
        style={{ marginTop: 16 }}
        rowKey={(record) => String(record.id ?? '')}
        columns={[
          { title: '标题', dataIndex: 'title' },
          { title: '类型', dataIndex: 'type' },
          { title: '内容', dataIndex: 'content' },
          { title: '创建时间', dataIndex: 'createdAt' },
          {
            title: '操作',
            render: (_unused: unknown, record: Record<string, unknown>) => (
              <Space>
                <Button
                  type="link"
                  onClick={async () => {
                    const id = String(record.id ?? '');
                    if (!id) {
                      return;
                    }

                    const nextTitle = await openTextInputModal({
                      title: '编辑公告标题',
                      initialValue: String(record.title ?? ''),
                      placeholder: '请输入标题',
                      requiredMessage: '公告标题不能为空',
                    });
                    if (nextTitle === null) {
                      return;
                    }

                    try {
                      await adminOperationsApi.updateAnnouncement(id, {
                        title: nextTitle,
                        type: String(record.type ?? 'system'),
                        content: String(record.content ?? ''),
                      });
                      await fetchAnnouncements();
                    } catch (err) {
                      setError(getErrorMessage(err, '公告更新失败'));
                    }
                  }}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  danger
                  onClick={async () => {
                    const id = String(record.id ?? '');
                    if (!id) {
                      return;
                    }

                    try {
                      await adminOperationsApi.deleteAnnouncement(id);
                      await fetchAnnouncements();
                    } catch (err) {
                      setError(getErrorMessage(err, '公告删除失败'));
                    }
                  }}
                >
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
        dataSource={data}
      />
    </Card>
  );
};

export default AnnouncementManagePage;
