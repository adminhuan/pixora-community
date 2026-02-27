import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userApi } from '../../api';
import { Card, Loading } from '../../components/ui';
import type { UserBrief } from '../../types/common';
import { extractList, getErrorMessage } from '../../utils';
import { UserCard } from './components/UserCard';

const UserFollowingPage = () => {
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<UserBrief[]>([]);

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await userApi.following(id);
        const list = extractList<Record<string, unknown>>(response).map((item) => {
          const following =
            typeof item.following === 'object' && item.following ? (item.following as Record<string, unknown>) : null;

          return {
            id: String(following?.id ?? item.id ?? ''),
            username: String(following?.nickname ?? following?.username ?? '匿名用户'),
            avatar: String(following?.avatar ?? ''),
          };
        });

        setUsers(list.filter((item) => item.id));
      } catch (err) {
        setError(getErrorMessage(err, '关注列表加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchFollowing();
  }, [id]);

  return (
    <Card title="关注列表">
      {loading && <Loading text="关注列表加载中..." />}
      {error && (
        <div role="alert" style={{ color: 'var(--color-error)', marginBottom: 12 }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gap: 10 }}>
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </Card>
  );
};

export default UserFollowingPage;
