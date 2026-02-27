import { useEffect, useMemo, useState } from 'react';
import { rankingApi } from '../../api';
import { Card, Loading } from '../../components/ui';
import { extractList, getErrorMessage } from '../../utils';
import { RankingList } from './components/RankingList';
import { RankingTabs } from './components/RankingTabs';
import { TimeRangeFilter } from './components/TimeRangeFilter';
import { TopThree } from './components/TopThree';

interface RankingRow {
  rank: number;
  username: string;
  points: number;
  level: string;
}

const RankingPage = () => {
  const [rankingType, setRankingType] = useState('total');
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<RankingRow[]>([]);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await rankingApi.list({ type: rankingType, period, page: 1 });
        const list = extractList<Record<string, unknown>>(response).map((item, index) => ({
          rank: Number(item.rank ?? index + 1),
          username: String(item.username ?? `用户${index + 1}`),
          points: Number(item.score ?? item.points ?? 0),
          level: Number(item.score ?? item.points ?? 0) >= 1000 ? '高手' : '进阶',
        }));

        setData(list);
      } catch (err) {
        setError(getErrorMessage(err, '排行榜加载失败'));
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchRankings();
  }, [period, rankingType]);

  const topThree = useMemo(() => data.slice(0, 3), [data]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card title="排行榜与积分">
        <div style={{ display: 'grid', gap: 10 }}>
          <RankingTabs active={rankingType} onChange={setRankingType} />
          <TimeRangeFilter active={period} onChange={setPeriod} />
        </div>
      </Card>
      {loading && <Loading text="排行榜加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        </Card>
      )}
      {!loading && topThree.length > 0 && <TopThree users={topThree} />}
      <RankingList list={data} />
    </div>
  );
};

export default RankingPage;
