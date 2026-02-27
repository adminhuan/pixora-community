import { useEffect, useState } from 'react';
import { userApi } from '../../api';
import { useAuth } from '../../hooks';
import { Button, Card } from '../ui';
import { extractData, getErrorMessage } from '../../utils';

export const NotificationSettings = () => {
  const { user } = useAuth();
  const [interaction, setInteraction] = useState(true);
  const [qa, setQa] = useState(true);
  const [system, setSystem] = useState(true);
  const [email, setEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const fetchSettings = async () => {
      try {
        const response = await userApi.profile(user.id);
        const profile = extractData<Record<string, unknown> | null>(response, null);
        const settings =
          typeof profile?.notificationSettings === 'object' && profile.notificationSettings
            ? (profile.notificationSettings as Record<string, unknown>)
            : {};

        setInteraction(Boolean(settings.comment ?? settings.interaction ?? true));
        setQa(Boolean(settings.reply ?? settings.qa ?? true));
        setSystem(Boolean(settings.system ?? true));
        setEmail(Boolean(settings.email ?? false));
      } catch {
        /* use defaults */
      }
    };

    void fetchSettings();
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await userApi.updateSettings({
        notificationSettings: { interaction, qa, system, email },
      });
      setMessage('通知设置已保存');
    } catch (err) {
      setMessage(getErrorMessage(err, '保存失败'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="通知设置">
      <div style={{ display: 'grid', gap: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={interaction} onChange={(e) => setInteraction(e.target.checked)} /> 互动通知（评论、点赞、关注）
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={qa} onChange={(e) => setQa(e.target.checked)} /> 问答通知（回答、采纳）
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={system} onChange={(e) => setSystem(e.target.checked)} /> 系统通知
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> 邮件通知
        </label>
        {message && (
          <div style={{ fontSize: 13, color: message.includes('失败') ? 'var(--color-error)' : 'var(--color-success)' }}>
            {message}
          </div>
        )}
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </Card>
  );
};
