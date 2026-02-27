import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { pointsApi, userApi } from '../../api';
import { Card, Loading } from '../../components/ui';
import { extractList, getErrorMessage } from '../../utils';

interface PointRecord {
  id: string;
  action: string;
  change: string;
  time: string;
}

const PointsDetailPage = () => {
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<PointRecord[]>([]);

  useEffect(() => {
    const fetchPoints = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [recordRes] = await Promise.all([userApi.points(id), pointsApi.rules()]);
        const list = extractList<Record<string, unknown>>(recordRes).map((item, index) => ({
          id: String(item.id ?? index),
          action: String(item.action ?? item.description ?? '积分变动'),
          change: `${Number(item.points ?? 0) > 0 ? '+' : ''}${Number(item.points ?? 0)}`,
          time: String(item.createdAt ?? ''),
        }));

        setRecords(list);
      } catch (err) {
        setError(getErrorMessage(err, '积分明细加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchPoints();
  }, [id]);

  return (
    <Card title="积分明细">
      {loading && <Loading text="积分明细加载中..." />}
      {error && (
        <div role="alert" style={{ color: 'var(--color-error)' }}>
          {error}
        </div>
      )}
      {!loading && (
        <table className="responsive-table">
          <thead>
            <tr>
              <th>行为</th>
              <th>积分变动</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.action}</td>
                <td>{record.change}</td>
                <td>{record.time || '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
};

export default PointsDetailPage;
