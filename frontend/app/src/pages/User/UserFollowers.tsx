import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userApi } from '../../api';
import { Card, Loading } from '../../components/ui';
import type { UserBrief } from '../../types/common';
import { extractList, getErrorMessage } from '../../utils';
import { UserCard } from './components/UserCard';

const UserFollowersPage = () => {
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<UserBrief[]>([]);

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await userApi.followers(id);
        const list = extractList<Record<string, unknown>>(response).map((item) => {
          const follower =
            typeof item.follower === 'object' && item.follower ? (item.follower as Record<string, unknown>) : null;

          return {
            id: String(follower?.id ?? item.id ?? ''),
            username: String(follower?.nickname ?? follower?.username ?? '匿名用户'),
            avatar: String(follower?.avatar ?? ''),
          };
        });

        setUsers(list.filter((item) => item.id));
      } catch (err) {
        setError(getErrorMessage(err, '粉丝列表加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchFollowers();
  }, [id]);

  return (
    <Card title="粉丝列表">
      {loading && <Loading text="粉丝加载中..." />}
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

export default UserFollowersPage;
