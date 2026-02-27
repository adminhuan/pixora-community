import { ArrowRight, Code2, MessageSquare, CheckCircle2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '../../hooks';
import { formatNumber, trackHomeClick } from '../../utils';

interface HeroBannerProps {
  stats: {
    postCount: number;
    snippetCount: number;
    resolvedRate: number;
  };
}

export const HeroBanner = ({ stats }: HeroBannerProps) => {
  const navigate = useNavigate();
  const { siteName } = useSiteSettings();

  return (
    <section className="hero animate-slide-up">
      {/* Decorative elements */}
      <div className="hero-glow" />
      <div className="hero-grid-overlay" />

      <div className="hero-body">
        <div className="hero-badges">
          <span className="hero-badge"><Zap size={12} /> 技术深度讨论</span>
          <span className="hero-badge">真实项目复盘</span>
          <span className="hero-badge">高质量代码分享</span>
        </div>

        <h1 className="hero-title">
          构建更专业的
          <br />
          <span className="hero-title-em">{siteName}</span>体验
        </h1>

        <p className="hero-desc">
          聚焦问题、代码、实践与复盘，让社区内容更有结构，让阅读与协作更高效。
        </p>

        <div className="hero-actions">
          <button
            className="hero-cta"
            onClick={() => {
              trackHomeClick({
                module: 'hero_forum',
                targetType: 'route',
                targetId: '/forum',
                targetTitle: '进入论坛主场'
              });
              navigate('/forum');
            }}
          >
            进入论坛主场 <ArrowRight size={15} />
          </button>
          <button
            className="hero-cta hero-cta--ghost"
            onClick={() => {
              trackHomeClick({
                module: 'hero_topic',
                targetType: 'route',
                targetId: '/code',
                targetTitle: '查看热门专题'
              });
              navigate('/code');
            }}
          >
            查看热门专题
          </button>
        </div>
      </div>

      <div className="hero-stats">
        <div className="hero-stat">
          <div className="hero-stat-icon">
            <MessageSquare size={20} />
          </div>
          <div className="hero-stat-body">
            <span className="hero-stat-value">{formatNumber(stats.postCount)}</span>
            <span className="hero-stat-label">论坛帖子总量</span>
          </div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-icon">
            <Code2 size={20} />
          </div>
          <div className="hero-stat-body">
            <span className="hero-stat-value">{formatNumber(stats.snippetCount)}</span>
            <span className="hero-stat-label">组件分享总量</span>
          </div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="hero-stat-body">
            <span className="hero-stat-value">{Math.max(0, Math.min(100, stats.resolvedRate))}%</span>
            <span className="hero-stat-label">近期问答解决率</span>
          </div>
        </div>
      </div>
    </section>
  );
};
