import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userApi } from '../../api';
import { AchievementWall } from '../../components/Points/AchievementWall';
import { Card, Loading } from '../../components/ui';
import { extractList, getErrorMessage } from '../../utils';

const AchievementListPage = () => {
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await userApi.achievements(id);
        const names = extractList<Record<string, unknown>>(response)
          .map((item) => {
            const achievement = item.achievement as { name?: string } | undefined;
            return String(achievement?.name ?? item.name ?? '').trim();
          })
          .filter(Boolean);
        setList(names);
      } catch (err) {
        setError(getErrorMessage(err, '成就列表加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchAchievements();
  }, [id]);

  return (
    <Card title="成就列表">
      {loading && <Loading text="成就加载中..." />}
      {error && (
        <div role="alert" style={{ color: 'var(--color-error)' }}>
          {error}
        </div>
      )}
      {!loading && <AchievementWall achievements={list} />}
    </Card>
  );
};

export default AchievementListPage;
