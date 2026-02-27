import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { questionApi } from '../../api';
import { Button, Card, Empty, Loading, Tabs } from '../../components/ui';
import type { ContentItem } from '../../types/common';
import { extractList, getErrorMessage } from '../../utils';
import { QuestionCard } from './components/QuestionCard';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'unsolved', label: '未解决' },
  { key: 'solved', label: '已解决' },
  { key: 'bounty', label: '悬赏中' },
];

const getStatusLabel = (item: Record<string, unknown>) => {
  const status = String(item.status ?? '').toLowerCase();
  if (status === 'solved') {
    return '已解决';
  }
  if (status === 'bounty') {
    return '悬赏中';
  }
  return '未解决';
};

const QuestionListPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [list, setList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await questionApi.list({ page: 1, limit: 20 });
        const data = extractList<Record<string, unknown>>(response).map((item) => ({
          id: String(item.id ?? ''),
          title: String(item.title ?? '未命名问题'),
          summary: String(item.summary ?? item.content ?? '').slice(0, 120),
          category: getStatusLabel(item),
          status: String(item.status ?? ''),
          author:
            typeof item.author === 'object' && item.author
              ? {
                  id: String((item.author as { id?: string }).id ?? ''),
                  username: String(
                    (item.author as { nickname?: string; username?: string }).nickname ??
                      (item.author as { username?: string }).username ??
                      '匿名用户',
                  ),
                }
              : { id: '', username: '匿名用户' },
        }));

        setList(data.filter((item) => item.id));
      } catch (err) {
        setError(getErrorMessage(err, '问答列表加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchQuestions();
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'all') {
      return list;
    }

    const labelMap: Record<string, string> = {
      unsolved: '未解决',
      solved: '已解决',
      bounty: '悬赏中',
    };

    return list.filter((item) => item.category === labelMap[activeTab]);
  }, [activeTab, list]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card
        title="技术问答"
        extra={
          <Button onClick={() => navigate('/qa/ask')}>
            <Plus size={14} /> 发布问题
          </Button>
        }
      >
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ color: 'var(--color-textSecondary)', fontSize: 14 }}>提出问题、追踪解决过程，与社区协作获得更快答案。</div>
          <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />
        </div>
      </Card>
      {loading && <Loading text="问答加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        </Card>
      )}
      {!loading && !filtered.length && <Empty description="暂无问答内容" />}
      {filtered.map((item) => (
        <Link key={item.id} to={`/qa/${item.id}`} style={{ position: 'relative' }}>
          {item.status === 'pending' && (
            <span style={{ position: 'absolute', top: 8, right: 8, zIndex: 1, fontSize: 12, padding: '2px 8px', borderRadius: 4, background: 'var(--color-warningBg, #fff8e1)', color: 'var(--color-warning, #e65100)', border: '1px solid var(--color-warningBorder, #ffe0b2)' }}>
              审核中
            </span>
          )}
          <QuestionCard item={item} />
        </Link>
      ))}
    </div>
  );
};

export default QuestionListPage;
