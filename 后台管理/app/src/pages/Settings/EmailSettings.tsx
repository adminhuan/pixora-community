import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Space } from 'antd';
import { adminSettingsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';

const EmailSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [state, setState] = useState({
    smtpHost: '',
    port: '465',
    from: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminSettingsApi.getGroup('email');
        const data = extractData<Record<string, unknown>>(response, {});

        setState({
          smtpHost: String(data.smtpHost ?? data.host ?? ''),
          port: String(data.port ?? '465'),
          from: String(data.from ?? data.sender ?? ''),
        });
      } catch (err) {
        setError(getErrorMessage(err, '邮件配置加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  return (
    <Card
      title="邮件配置"
      loading={loading}
      extra={
        <Button
          loading={testing}
          onClick={async () => {
            setTesting(true);
            setError('');
            setSuccess('');

            try {
              await adminSettingsApi.testEmail({ to: state.from || 'admin@example.com' });
              setSuccess('测试邮件发送成功');
            } catch (err) {
              setError(getErrorMessage(err, '测试邮件发送失败'));
            } finally {
              setTesting(false);
            }
          }}
        >
          测试邮件
        </Button>
      }
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} />}
      <Form layout="vertical">
        <Form.Item label="SMTP 服务器">
          <Input value={state.smtpHost} onChange={(event) => setState((prev) => ({ ...prev, smtpHost: event.target.value }))} />
        </Form.Item>
        <Form.Item label="端口">
          <Input value={state.port} onChange={(event) => setState((prev) => ({ ...prev, port: event.target.value }))} />
        </Form.Item>
        <Form.Item label="发件人邮箱">
          <Input value={state.from} onChange={(event) => setState((prev) => ({ ...prev, from: event.target.value }))} />
        </Form.Item>
        <Space>
          <Button
            type="primary"
            loading={saving}
            onClick={async () => {
              setSaving(true);
              setError('');
              setSuccess('');

              try {
                await adminSettingsApi.updateGroup('email', state);
                setSuccess('邮件配置已保存');
              } catch (err) {
                setError(getErrorMessage(err, '邮件配置保存失败'));
              } finally {
                setSaving(false);
              }
            }}
          >
            保存配置
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default EmailSettingsPage;
