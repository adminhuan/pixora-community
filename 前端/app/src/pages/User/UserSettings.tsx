import { useEffect, useState } from 'react';
import { userApi } from '../../api';
import { useAuth } from '../../hooks';
import { Button, Card, Loading } from '../../components/ui';
import { extractData, getErrorMessage } from '../../utils';

const UserSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nickname, setNickname] = useState('');
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [inboxNotice, setInboxNotice] = useState(true);
  const [emailNotice, setEmailNotice] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const targetId = user?.id?.trim() || 'me';
        const response = await userApi.profile(targetId);
        const profile = extractData<Record<string, unknown> | null>(response, null);
        const settings =
          typeof profile?.notificationSettings === 'object' && profile.notificationSettings
            ? (profile.notificationSettings as Record<string, unknown>)
            : {};

        setNickname(String(profile?.nickname ?? profile?.username ?? ''));
        setPosition(String(profile?.position ?? ''));
        setCompany(String(profile?.company ?? ''));
        setBio(String(profile?.bio ?? ''));
        setInboxNotice(Boolean(settings.inbox ?? true));
        setEmailNotice(Boolean(settings.email ?? true));
      } catch (err) {
        setError(getErrorMessage(err, '用户设置加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [user?.id]);

  return (
    <Card title="个人设置">
      {loading && <Loading text="设置加载中..." />}
      {error && (
        <div role="alert" style={{ color: 'var(--color-error)', marginBottom: 12 }}>
          {error}
        </div>
      )}
      {success && <div style={{ color: 'var(--color-success)', marginBottom: 12 }}>{success}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        <input className="input" placeholder="昵称" value={nickname} onChange={(event) => setNickname(event.target.value)} />
        <input className="input" placeholder="职位" value={position} onChange={(event) => setPosition(event.target.value)} />
        <input className="input" placeholder="公司" value={company} onChange={(event) => setCompany(event.target.value)} />
        <textarea className="textarea" rows={4} placeholder="个人简介" value={bio} onChange={(event) => setBio(event.target.value)} />
        <label>
          <input type="checkbox" checked={inboxNotice} onChange={(event) => setInboxNotice(event.target.checked)} /> 开启站内通知
        </label>
        <label>
          <input type="checkbox" checked={emailNotice} onChange={(event) => setEmailNotice(event.target.checked)} /> 开启邮件通知
        </label>
        <Button
          onClick={async () => {
            setSaving(true);
            setError('');
            setSuccess('');

            try {
              const profileRes = await userApi.updateProfile({
                nickname,
                position,
                company,
                bio,
              });

              await userApi.updateSettings({
                notificationSettings: {
                  inbox: inboxNotice,
                  email: emailNotice,
                },
              });

              const profile = extractData<Record<string, unknown> | null>(profileRes, null);
              updateUser({
                id: String(profile?.id ?? user?.id ?? ''),
                username: String(profile?.nickname ?? profile?.username ?? user?.username ?? '开发者'),
              });
              setSuccess('设置保存成功');
            } catch (err) {
              setError(getErrorMessage(err, '设置保存失败'));
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </Card>
  );
};

export default UserSettingsPage;
