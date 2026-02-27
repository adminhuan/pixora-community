import { useEffect, useState } from 'react';
import { Card, Loading } from '../../components/ui';
import { postApi, questionApi, snippetApi, tagApi } from '../../api';
import { extractList, extractPagination, getErrorMessage } from '../../utils';
import { HeroBanner } from './HeroBanner';
import { HotPosts } from './HotPosts';
import { LatestQA } from './LatestQA';
import { CodeHighlights } from './CodeHighlights';
import { TechToolVote } from './TechToolVote';
import { TrendingTags } from './TrendingTags';

interface PostPreview {
  id: string;
  title: string;
}

interface QuestionPreview {
  id: string;
  title: string;
  status: string;
}

interface SnippetPreview {
  id: string;
  title: string;
  subtitle: string;
}

interface TagPreview {
  id: string;
  name: string;
}

interface HomeMetrics {
  postCount: number;
  snippetCount: number;
  resolvedRate: number;
}

interface HomeState {
  posts: PostPreview[];
  questions: QuestionPreview[];
  snippets: SnippetPreview[];
  tags: TagPreview[];
  metrics: HomeMetrics;
}

const getQuestionStatus = (item: Record<string, unknown>): string => {
  const raw = String(item.status ?? item.solveStatus ?? '').toLowerCase();
  if (raw.includes('resolved') || raw.includes('solved') || Boolean(item.acceptedAnswer)) {
    return '已解决';
  }
  if (raw.includes('pending') || raw.includes('open')) {
    return '待处理';
  }
  return '讨论中';
};

const defaultState: HomeState = {
  posts: [],
  questions: [],
  snippets: [],
  tags: [],
  metrics: {
    postCount: 0,
    snippetCount: 0,
    resolvedRate: 0
  }
};

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [state, setState] = useState<HomeState>(defaultState);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const [postRes, questionRes, snippetRes, tagRes] = await Promise.all([
          postApi.list({ page: 1, limit: 5, sort: 'hot' }),
          questionApi.list({ page: 1, limit: 100 }),
          snippetApi.list({ page: 1, limit: 5, type: 'component', visibility: 'public', sort: 'popular' }),
          tagApi.hot()
        ]);

        const postRows = extractList<Record<string, unknown>>(postRes);
        const questionRows = extractList<Record<string, unknown>>(questionRes);
        const snippetRows = extractList<Record<string, unknown>>(snippetRes);
        const tagRows = extractList<Record<string, unknown>>(tagRes);

        const posts = postRows
          .map((item) => ({
            id: String(item.id ?? '').trim(),
            title: String(item.title ?? '').trim()
          }))
          .filter((item) => item.id && item.title)
          .slice(0, 5);

        const questions = questionRows
          .map((item) => ({
            id: String(item.id ?? '').trim(),
            title: String(item.title ?? '').trim(),
            status: getQuestionStatus(item)
          }))
          .filter((item) => item.id && item.title)
          .slice(0, 5);

        const snippets = snippetRows
          .map((item) => {
            const framework = String(item.framework ?? '').trim();
            const category = String(item.category ?? '').trim();
            const subtitle = [framework, category].filter(Boolean).join(' · ') || '开源 UI 组件持续更新中';
            return {
              id: String(item.id ?? '').trim(),
              title: String(item.title ?? '').trim(),
              subtitle
            };
          })
          .filter((item) => item.id && item.title)
          .slice(0, 5);

        const tags = tagRows
          .map((item) => ({
            id: String(item.id ?? '').trim(),
            name: String(item.name ?? item.label ?? '').trim()
          }))
          .filter((item) => item.id && item.name)
          .slice(0, 8);

        const resolvedCount = questionRows.filter((item) => getQuestionStatus(item) === '已解决').length;
        const resolvedRate =
          questionRows.length > 0 ? Math.max(0, Math.min(100, Math.round((resolvedCount / questionRows.length) * 100))) : 0;

        const postCount = Number(extractPagination(postRes)?.total ?? postRows.length);
        const snippetCount = Number(extractPagination(snippetRes)?.total ?? snippetRows.length);

        setState({
          posts,
          questions,
          snippets,
          tags,
          metrics: {
            postCount: Number.isFinite(postCount) ? postCount : 0,
            snippetCount: Number.isFinite(snippetCount) ? snippetCount : 0,
            resolvedRate
          }
        });
      } catch (err) {
        setError(getErrorMessage(err, '首页数据加载失败'));
        setState(defaultState);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  return (
    <div className="home-stack">
      <HeroBanner stats={state.metrics} />
      {loading && <Loading text="首页数据加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" className="error-text">{error}</div>
        </Card>
      )}

      <div className="home-grid">
        <HotPosts posts={state.posts} />
        <LatestQA list={state.questions} />
      </div>

      <div className="home-grid">
        <CodeHighlights snippets={state.snippets} />
        <TrendingTags tags={state.tags} />
      </div>

      <div className="home-grid">
        <TechToolVote />
      </div>
    </div>
  );
};

export default HomePage;
