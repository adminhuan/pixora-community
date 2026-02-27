import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Select, Space } from 'antd';
import { adminSettingsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';

const StorageSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [state, setState] = useState({
    provider: 'local',
    accessKey: '',
    secretKey: '',
    cdnUrl: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminSettingsApi.getGroup('storage');
        const data = extractData<Record<string, unknown>>(response, {});

        setState({
          provider: String(data.provider ?? 'local'),
          accessKey: String(data.accessKey ?? ''),
          secretKey: String(data.secretKey ?? ''),
          cdnUrl: String(data.cdnUrl ?? '')
        });
      } catch (err) {
        setError(getErrorMessage(err, '存储配置加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  return (
    <Card
      title="存储配置"
      loading={loading}
      extra={
        <Button
          loading={checking}
          onClick={async () => {
            setChecking(true);
            setError('');
            setSuccess('');

            try {
              const response = await adminSettingsApi.testStorage(state);
              const data = extractData<Record<string, unknown>>(response, {});
              const provider = String(data.provider ?? state.provider);
              setSuccess(`存储连接测试成功（${provider}）`);
            } catch (err) {
              setError(getErrorMessage(err, '配置校验失败'));
            } finally {
              setChecking(false);
            }
          }}
        >
          测试存储连接
        </Button>
      }
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} />}
      <Form layout="vertical">
        <Form.Item label="存储方式">
          <Select
            value={state.provider}
            onChange={(value) => setState((prev) => ({ ...prev, provider: value }))}
            options={[
              { label: '本地存储', value: 'local' },
              { label: '阿里云 OSS', value: 'oss' },
              { label: '七牛云', value: 'qiniu' }
            ]}
          />
        </Form.Item>
        <Form.Item label="AccessKey">
          <Input value={state.accessKey} onChange={(event) => setState((prev) => ({ ...prev, accessKey: event.target.value }))} />
        </Form.Item>
        <Form.Item label="SecretKey">
          <Input.Password value={state.secretKey} onChange={(event) => setState((prev) => ({ ...prev, secretKey: event.target.value }))} />
        </Form.Item>
        <Form.Item label="CDN 域名">
          <Input
            placeholder="https://cdn.example.com"
            value={state.cdnUrl}
            onChange={(event) => setState((prev) => ({ ...prev, cdnUrl: event.target.value }))}
          />
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
                await adminSettingsApi.updateGroup('storage', state);
                setSuccess('存储配置已保存');
              } catch (err) {
                setError(getErrorMessage(err, '存储配置保存失败'));
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

export default StorageSettingsPage;
