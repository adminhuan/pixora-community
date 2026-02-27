import { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { pollApi } from '../../api';
import { extractData, getErrorMessage } from '../../utils';

interface VoteOption {
  id: string;
  label: string;
  voteCount: number;
  votePercent: number;
}

interface VotePayload {
  poll: {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
  };
  options: VoteOption[];
  totalVotes: number;
  hasVoted: boolean;
  votedOptionId?: string;
}

interface TechToolVoteProps {
  variant?: 'full' | 'sidebar';
}

const parseVotePayload = (payload: unknown): VotePayload | null => {
  const data = extractData<Record<string, unknown> | null>(payload, null);
  if (!data) {
    return null;
  }

  const poll = (data.poll ?? {}) as Record<string, unknown>;
  const optionsRaw = Array.isArray(data.options) ? data.options : [];
  const options = optionsRaw
    .map((item) => {
      const source = item as Record<string, unknown>;
      return {
        id: String(source.id ?? '').trim(),
        label: String(source.label ?? '').trim(),
        voteCount: Number(source.voteCount ?? 0),
        votePercent: Number(source.votePercent ?? 0)
      };
    })
    .filter((item) => item.id && item.label);

  return {
    poll: {
      id: String(poll.id ?? '').trim(),
      title: String(poll.title ?? '').trim(),
      description: String(poll.description ?? '').trim(),
      enabled: Boolean(poll.enabled)
    },
    options,
    totalVotes: Number(data.totalVotes ?? 0),
    hasVoted: Boolean(data.hasVoted),
    votedOptionId: String(data.votedOptionId ?? '').trim() || undefined
  };
};

export const TechToolVote = ({ variant = 'full' }: TechToolVoteProps) => {
  const isSidebar = variant === 'sidebar';
  const [loading, setLoading] = useState(true);
  const [submittingOptionId, setSubmittingOptionId] = useState('');
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<VotePayload | null>(null);

  const fetchVote = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await pollApi.detail();
      setPayload(parseVotePayload(response));
    } catch (requestError) {
      setError(getErrorMessage(requestError, '投票数据加载失败'));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchVote();
  }, []);

  const canVote = useMemo(() => {
    if (!payload) {
      return false;
    }
    return payload.poll.enabled && !payload.hasVoted;
  }, [payload]);

  return (
    <section
      className={`home-section home-vote-section ${isSidebar ? 'home-vote-section--sidebar' : 'home-vote-section--full'} animate-fade-in`}
    >
      <header className="home-section-header">
        <h3 className="home-section-title">
          <span className="home-section-icon home-section-icon--vote"><BarChart3 size={16} /></span>
          AI 编程工具投票
        </h3>
        <span className="home-section-extra">{`总票数 ${payload?.totalVotes ?? 0}`}</span>
      </header>

      {loading ? <div className="home-vote-loading">投票数据加载中...</div> : null}
      {!loading && error ? <div role="alert" className="error-text">{error}</div> : null}

      {!loading && !error && payload ? (
        <div className={`home-vote-body ${isSidebar ? 'home-vote-body--sidebar' : ''}`}>
          <div className="home-vote-meta">
            <h4 className="home-vote-title">{payload.poll.title}</h4>
            <p className="home-vote-description">{payload.poll.description}</p>
          </div>

          <ul className="home-vote-list">
            {payload.options.map((option) => {
              const isSelected = payload.votedOptionId === option.id;
              const isSubmitting = submittingOptionId === option.id;

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    className={`home-vote-item ${isSelected ? 'home-vote-item--selected' : ''}`}
                    disabled={!canVote || isSubmitting}
                    onClick={async () => {
                      if (!canVote || isSubmitting) {
                        return;
                      }

                      setSubmittingOptionId(option.id);
                      setError('');

                      try {
                        const response = await pollApi.vote(option.id);
                        setPayload(parseVotePayload(response));
                      } catch (requestError) {
                        setError(getErrorMessage(requestError, '投票失败'));
                      } finally {
                        setSubmittingOptionId('');
                      }
                    }}
                  >
                    <div className="home-vote-item-head">
                      <span className="home-vote-item-label">{option.label}</span>
                      <span className="home-vote-item-value">{`${option.voteCount} 票 · ${option.votePercent}%`}</span>
                    </div>
                    <div className="home-vote-item-track">
                      <span className="home-vote-item-fill" style={{ width: `${Math.max(0, Math.min(100, option.votePercent))}%` }} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="home-vote-tip">
            {!payload.poll.enabled
              ? '投票暂未开放'
              : payload.hasVoted
                ? '当前 IP 已投票，不能重复投票'
                : '每个 IP 仅可投票一次'}
          </div>
        </div>
      ) : null}
    </section>
  );
};
