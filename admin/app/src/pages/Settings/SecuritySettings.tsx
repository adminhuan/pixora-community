import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Space, Statistic, Switch, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { adminIpBlacklistApi, adminIpWhitelistApi, adminSettingsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';

const SecuritySettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ipLoading, setIpLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [state, setState] = useState({
    captchaEnabled: true,
    emailVerifyEnabled: false,
    smsVerifyEnabled: false,
    maxLoginAttempts: 5,
    ipWhitelistEnabled: false,
    ipAlertThreshold: 20,
    ipAlertNotifyEnabled: false,
    ipAlertNotifyCooldownMinutes: 30,
    ipAlertNotifyEmail: ''
  });
  const [ipStats, setIpStats] = useState({
    whitelistCount: 0,
    blacklistCount: 0
  });

  useEffect(() => {
    const fetchPageData = async () => {
      setLoading(true);
      setError('');

      try {
        const [settingsRes, whitelistRes, blacklistRes] = await Promise.all([
          adminSettingsApi.getGroup('security'),
          adminIpWhitelistApi.list(),
          adminIpBlacklistApi.list()
        ]);
        const data = extractData<Record<string, unknown>>(settingsRes, {});
        const whitelist = extractData<Array<Record<string, unknown>>>(whitelistRes, []);
        const blacklist = extractData<Array<Record<string, unknown>>>(blacklistRes, []);

        setState((prev) => ({
          ...prev,
          captchaEnabled: Boolean(data.captchaEnabled ?? prev.captchaEnabled),
          emailVerifyEnabled: Boolean(data.emailVerifyEnabled ?? prev.emailVerifyEnabled),
          smsVerifyEnabled: Boolean(data.smsVerifyEnabled ?? prev.smsVerifyEnabled),
          maxLoginAttempts: Number(data.maxLoginAttempts ?? prev.maxLoginAttempts),
          ipWhitelistEnabled: Boolean(data.ipWhitelistEnabled ?? prev.ipWhitelistEnabled),
          ipAlertThreshold: Number(data.ipAlertThreshold ?? prev.ipAlertThreshold),
          ipAlertNotifyEnabled: Boolean(data.ipAlertNotifyEnabled ?? prev.ipAlertNotifyEnabled),
          ipAlertNotifyCooldownMinutes: Number(
            data.ipAlertNotifyCooldownMinutes ?? prev.ipAlertNotifyCooldownMinutes
          ),
          ipAlertNotifyEmail: String(data.ipAlertNotifyEmail ?? prev.ipAlertNotifyEmail)
        }));
        setIpStats({
          whitelistCount: Array.isArray(whitelist) ? whitelist.length : 0,
          blacklistCount: Array.isArray(blacklist) ? blacklist.length : 0
        });
      } catch (err) {
        setError(getErrorMessage(err, '安全设置加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchPageData();
  }, []);

  return (
    <Card title="安全设置" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} />}
      <Card
        type="inner"
        title="IP访问控制概览"
        style={{ marginBottom: 12 }}
        extra={
          <Button
            type="link"
            onClick={() => navigate('/users/list')}
            style={{ paddingInline: 0 }}
          >
            前往用户管理维护
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            type={state.ipWhitelistEnabled ? 'warning' : 'info'}
            showIcon
            message={
              state.ipWhitelistEnabled
                ? '白名单拦截已启用，仅白名单IP可访问后端接口'
                : '白名单拦截未启用，当前仅黑名单生效'
            }
          />
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Card loading={ipLoading}>
                <Statistic title="白名单IP数量" value={ipStats.whitelistCount} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card loading={ipLoading}>
                <Statistic title="黑名单IP数量" value={ipStats.blacklistCount} />
              </Card>
            </Col>
          </Row>
          <Button
            onClick={async () => {
              setIpLoading(true);
              setError('');
              try {
                const [whitelistRes, blacklistRes] = await Promise.all([
                  adminIpWhitelistApi.list(),
                  adminIpBlacklistApi.list()
                ]);
                const whitelist = extractData<Array<Record<string, unknown>>>(whitelistRes, []);
                const blacklist = extractData<Array<Record<string, unknown>>>(blacklistRes, []);
                setIpStats({
                  whitelistCount: Array.isArray(whitelist) ? whitelist.length : 0,
                  blacklistCount: Array.isArray(blacklist) ? blacklist.length : 0
                });
              } catch (err) {
                setError(getErrorMessage(err, 'IP访问控制统计刷新失败'));
              } finally {
                setIpLoading(false);
              }
            }}
            disabled={ipLoading}
          >
            刷新IP统计
          </Button>
        </Space>
      </Card>
      <Form layout="vertical">
        <Form.Item label="启用IP白名单拦截">
          <Switch
            checked={state.ipWhitelistEnabled}
            onChange={(value) => setState((prev) => ({ ...prev, ipWhitelistEnabled: value }))}
            checkedChildren="已启用"
            unCheckedChildren="未启用"
          />
          <div style={{ marginTop: 8 }}>
            <Tag color={state.ipWhitelistEnabled ? 'gold' : 'default'}>
              {state.ipWhitelistEnabled ? '仅允许白名单IP访问' : '不启用白名单强拦截'}
            </Tag>
          </div>
        </Form.Item>
        <Form.Item label="启用图形验证码">
          <Switch
            checked={state.captchaEnabled}
            onChange={(value) => setState((prev) => ({ ...prev, captchaEnabled: value }))}
          />
        </Form.Item>
        <Form.Item label="启用邮箱验证">
          <Switch
            checked={state.emailVerifyEnabled}
            onChange={(value) => setState((prev) => ({ ...prev, emailVerifyEnabled: value }))}
          />
        </Form.Item>
        <Form.Item label="启用短信验证">
          <Switch
            checked={state.smsVerifyEnabled}
            onChange={(value) => setState((prev) => ({ ...prev, smsVerifyEnabled: value }))}
          />
        </Form.Item>
        <Form.Item label="最大登录失败次数">
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={20}
            value={state.maxLoginAttempts}
            onChange={(value) => setState((prev) => ({ ...prev, maxLoginAttempts: Number(value ?? 5) }))}
          />
        </Form.Item>
        <Card
          type="inner"
          title="IP防护告警设置"
          style={{ marginBottom: 12 }}
        >
          <Form.Item label="告警阈值（单个时间桶拦截次数）">
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={100000}
              value={state.ipAlertThreshold}
              onChange={(value) => setState((prev) => ({ ...prev, ipAlertThreshold: Number(value ?? 20) }))}
            />
          </Form.Item>
          <Form.Item label="启用告警通知">
            <Switch
              checked={state.ipAlertNotifyEnabled}
              onChange={(value) => setState((prev) => ({ ...prev, ipAlertNotifyEnabled: value }))}
              checkedChildren="已启用"
              unCheckedChildren="未启用"
            />
          </Form.Item>
          <Form.Item label="告警冷却时间（分钟）">
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={1440}
              value={state.ipAlertNotifyCooldownMinutes}
              onChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  ipAlertNotifyCooldownMinutes: Number(value ?? 30)
                }))
              }
            />
          </Form.Item>
          <Form.Item label="告警邮箱（可选）">
            <Input
              placeholder="例如 security@example.com"
              value={state.ipAlertNotifyEmail}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  ipAlertNotifyEmail: event.target.value
                }))
              }
              allowClear
            />
          </Form.Item>
        </Card>
        <Button
          type="primary"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            setError('');
            setSuccess('');

            try {
              await adminSettingsApi.updateGroup('security', state);
              setSuccess('安全设置已保存');
            } catch (err) {
              setError(getErrorMessage(err, '安全设置保存失败'));
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

export default SecuritySettingsPage;
