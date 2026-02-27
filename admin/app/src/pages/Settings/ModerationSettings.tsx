import { useEffect, useState } from 'react';
import { Alert, Button, Card, Checkbox, Form, Input, InputNumber, Switch } from 'antd';
import { adminSettingsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';

const contentTypeOptions = [
  { label: '帖子', value: 'post' },
  { label: '博客', value: 'blog' },
  { label: '问答', value: 'question' },
  { label: '评论', value: 'comment' },
  { label: '回答', value: 'answer' },
];

const ModerationSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [state, setState] = useState({
    preReviewEnabled: false,
    preReviewTypes: [] as string[],
    aiEnabled: false,
    aiEndpoint: '',
    aiAuthToken: '',
    aiModel: 'openclaw:main',
    aiTimeoutMs: 300000,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await adminSettingsApi.getGroup('content_moderation');
        const data = extractData<Record<string, unknown>>(response, {});
        setState({
          preReviewEnabled: Boolean(data.preReviewEnabled),
          preReviewTypes: Array.isArray(data.preReviewTypes) ? data.preReviewTypes.map(String) : [],
          aiEnabled: Boolean(data.aiEnabled),
          aiEndpoint: String(data.aiEndpoint ?? ''),
          aiAuthToken: String(data.aiAuthToken ?? ''),
          aiModel: String(data.aiModel ?? 'openclaw:main'),
          aiTimeoutMs: Number(data.aiTimeoutMs) || 10000,
        });
      } catch (err) {
        setError(getErrorMessage(err, '审核配置加载失败'));
      } finally {
        setLoading(false);
      }
    };
    void fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminSettingsApi.updateGroup('content_moderation', state);
      setSuccess('审核配置已保存');
    } catch (err) {
      setError(getErrorMessage(err, '审核配置保存失败'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestAI = async () => {
    setTesting(true);
    setError('');
    setSuccess('');
    try {
      const response = await adminSettingsApi.testAI({
        aiEndpoint: state.aiEndpoint,
        aiAuthToken: state.aiAuthToken,
        aiModel: state.aiModel,
        aiTimeoutMs: state.aiTimeoutMs,
      });
      const data = extractData<Record<string, unknown>>(response, {});
      if (data.ok) {
        setSuccess('AI 审核连接测试成功');
      } else {
        setError(String(data.message ?? 'AI 审核连接测试失败'));
      }
    } catch (err) {
      setError(getErrorMessage(err, 'AI 审核连接测试失败'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>审核配置</h2>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 0 }} />}
      {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 0 }} />}

      <Card title="先审后发配置" loading={loading}>
        <Form layout="vertical">
          <Form.Item label="启用先审后发">
            <Switch
              checked={state.preReviewEnabled}
              onChange={(checked) => setState((prev) => ({ ...prev, preReviewEnabled: checked }))}
            />
          </Form.Item>
          <Form.Item label="需要审核的内容类型">
            <Checkbox.Group
              options={contentTypeOptions}
              value={state.preReviewTypes}
              onChange={(values) => setState((prev) => ({ ...prev, preReviewTypes: values as string[] }))}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="OpenClaw AI 审核配置"
        loading={loading}
        extra={
          <Button loading={testing} onClick={handleTestAI}>
            测试连接
          </Button>
        }
      >
        <Form layout="vertical">
          <Form.Item label="启用 AI 审核">
            <Switch
              checked={state.aiEnabled}
              onChange={(checked) => setState((prev) => ({ ...prev, aiEnabled: checked }))}
            />
          </Form.Item>
          <Form.Item label="API 地址">
            <Input
              placeholder="https://api.example.com/v1/chat/completions"
              value={state.aiEndpoint}
              onChange={(e) => setState((prev) => ({ ...prev, aiEndpoint: e.target.value }))}
            />
          </Form.Item>
          <Form.Item label="Auth Token">
            <Input.Password
              placeholder="留空表示不使用认证"
              value={state.aiAuthToken}
              onChange={(e) => setState((prev) => ({ ...prev, aiAuthToken: e.target.value }))}
            />
          </Form.Item>
          <Form.Item label="模型名称">
            <Input
              placeholder="openclaw:main"
              value={state.aiModel}
              onChange={(e) => setState((prev) => ({ ...prev, aiModel: e.target.value }))}
            />
          </Form.Item>
          <Form.Item label="超时时间" extra="OpenClaw 使用排队机制，建议设置 300000ms（5分钟）以匹配队列等待时间">
            <InputNumber
              min={1000}
              max={600000}
              step={10000}
              value={state.aiTimeoutMs}
              onChange={(value) => setState((prev) => ({ ...prev, aiTimeoutMs: value ?? 300000 }))}
              style={{ width: 200 }}
              addonAfter="ms"
            />
          </Form.Item>
        </Form>
      </Card>

      <div>
        <Button type="primary" loading={saving} onClick={handleSave}>
          保存配置
        </Button>
      </div>
    </div>
  );
};

export default ModerationSettingsPage;
