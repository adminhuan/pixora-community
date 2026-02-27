import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, InputNumber } from 'antd';
import { adminSettingsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';

const ContentSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [state, setState] = useState({
    postMaxLength: 5000,
    commentMaxLength: 500,
    imageMaxMb: 10,
    postIntervalSeconds: 30,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminSettingsApi.getGroup('content');
        const data = extractData<Record<string, unknown>>(response, {});

        setState((prev) => ({
          ...prev,
          postMaxLength: Number(data.postMaxLength ?? prev.postMaxLength),
          commentMaxLength: Number(data.commentMaxLength ?? prev.commentMaxLength),
          imageMaxMb: Number(data.imageMaxMb ?? prev.imageMaxMb),
          postIntervalSeconds: Number(data.postIntervalSeconds ?? prev.postIntervalSeconds),
        }));
      } catch (err) {
        setError(getErrorMessage(err, '内容设置加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  return (
    <Card title="内容限制设置" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} />}
      <Form layout="vertical">
        <Form.Item label="帖子最大字数">
          <InputNumber
            style={{ width: '100%' }}
            value={state.postMaxLength}
            onChange={(value) => setState((prev) => ({ ...prev, postMaxLength: Number(value ?? 0) }))}
          />
        </Form.Item>
        <Form.Item label="评论最大字数">
          <InputNumber
            style={{ width: '100%' }}
            value={state.commentMaxLength}
            onChange={(value) => setState((prev) => ({ ...prev, commentMaxLength: Number(value ?? 0) }))}
          />
        </Form.Item>
        <Form.Item label="图片上传最大尺寸（MB）">
          <InputNumber
            style={{ width: '100%' }}
            value={state.imageMaxMb}
            onChange={(value) => setState((prev) => ({ ...prev, imageMaxMb: Number(value ?? 0) }))}
          />
        </Form.Item>
        <Form.Item label="发帖间隔（秒）">
          <InputNumber
            style={{ width: '100%' }}
            value={state.postIntervalSeconds}
            onChange={(value) => setState((prev) => ({ ...prev, postIntervalSeconds: Number(value ?? 0) }))}
          />
        </Form.Item>
        <Button
          type="primary"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            setError('');
            setSuccess('');

            try {
              await adminSettingsApi.updateGroup('content', state);
              setSuccess('内容设置已保存');
            } catch (err) {
              setError(getErrorMessage(err, '内容设置保存失败'));
            } finally {
              setSaving(false);
            }
          }}
        >
          保存配置
        </Button>
      </Form>
    </Card>
  );
};

export default ContentSettingsPage;
