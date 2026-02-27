import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Switch } from 'antd';
import { adminSettingsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';

const FeatureSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [state, setState] = useState({
    registerEnabled: true,
    inviteOnly: false,
    commentAudit: true,
    postAudit: true,
    githubLogin: true,
    wechatLogin: false,
    bountyEnabled: true,
    pointsEnabled: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminSettingsApi.getGroup('feature');
        const data = extractData<Record<string, unknown>>(response, {});

        setState((prev) => ({
          ...prev,
          registerEnabled: Boolean(data.registerEnabled ?? prev.registerEnabled),
          inviteOnly: Boolean(data.inviteOnly ?? prev.inviteOnly),
          commentAudit: Boolean(data.commentAudit ?? prev.commentAudit),
          postAudit: Boolean(data.postAudit ?? prev.postAudit),
          githubLogin: Boolean(data.githubLogin ?? prev.githubLogin),
          wechatLogin: Boolean(data.wechatLogin ?? prev.wechatLogin),
          bountyEnabled: Boolean(data.bountyEnabled ?? prev.bountyEnabled),
          pointsEnabled: Boolean(data.pointsEnabled ?? prev.pointsEnabled),
        }));
      } catch (err) {
        setError(getErrorMessage(err, '功能设置加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  return (
    <Card title="功能开关设置" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} />}
      <Form layout="vertical">
        <Form.Item label="开启注册">
          <Switch checked={state.registerEnabled} onChange={(value) => setState((prev) => ({ ...prev, registerEnabled: value }))} />
        </Form.Item>
        <Form.Item label="邀请码注册">
          <Switch checked={state.inviteOnly} onChange={(value) => setState((prev) => ({ ...prev, inviteOnly: value }))} />
        </Form.Item>
        <Form.Item label="评论审核">
          <Switch checked={state.commentAudit} onChange={(value) => setState((prev) => ({ ...prev, commentAudit: value }))} />
        </Form.Item>
        <Form.Item label="帖子审核">
          <Switch checked={state.postAudit} onChange={(value) => setState((prev) => ({ ...prev, postAudit: value }))} />
        </Form.Item>
        <Form.Item label="GitHub 登录">
          <Switch checked={state.githubLogin} onChange={(value) => setState((prev) => ({ ...prev, githubLogin: value }))} />
        </Form.Item>
        <Form.Item label="微信登录">
          <Switch checked={state.wechatLogin} onChange={(value) => setState((prev) => ({ ...prev, wechatLogin: value }))} />
        </Form.Item>
        <Form.Item label="悬赏功能">
          <Switch checked={state.bountyEnabled} onChange={(value) => setState((prev) => ({ ...prev, bountyEnabled: value }))} />
        </Form.Item>
        <Form.Item label="积分功能">
          <Switch checked={state.pointsEnabled} onChange={(value) => setState((prev) => ({ ...prev, pointsEnabled: value }))} />
        </Form.Item>
        <Button
          type="primary"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            setError('');
            setSuccess('');

            try {
              await adminSettingsApi.updateGroup('feature', state);
              setSuccess('功能设置已保存');
            } catch (err) {
              setError(getErrorMessage(err, '功能设置保存失败'));
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

export default FeatureSettingsPage;
