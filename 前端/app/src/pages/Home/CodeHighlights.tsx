import { Blocks } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Empty } from '../../components/ui';
import { resolveSafeUrl, trackHomeClick } from '../../utils';

const COMPONENT_PLAZA_RAW_URL = String(import.meta.env.VITE_COMPONENT_PLAZA_URL ?? '').trim();
const COMPONENT_PLAZA_URL = resolveSafeUrl(COMPONENT_PLAZA_RAW_URL, {
  allowRelative: false,
  allowMailTo: false,
  allowTel: false,
  allowHash: false
});
const COMPONENT_PLAZA_ENABLED = COMPONENT_PLAZA_URL.length > 0;

interface CodeHighlightsProps {
  snippets: Array<{
    id: string;
    title: string;
    subtitle: string;
  }>;
}

export const CodeHighlights = ({ snippets }: CodeHighlightsProps) => (
  <section className="home-section animate-fade-in">
    <header className="home-section-header">
      <h3 className="home-section-title">
        <span className="home-section-icon home-section-icon--code"><Blocks size={16} /></span>
        热门组件
      </h3>
      {COMPONENT_PLAZA_ENABLED ? (
        <a href={COMPONENT_PLAZA_URL} target="_blank" rel="noopener noreferrer" className="home-section-extra">组件广场</a>
      ) : (
        <span className="home-section-extra" style={{ opacity: 0.5, cursor: 'not-allowed' }} title="请配置 VITE_COMPONENT_PLAZA_URL">
          组件广场
        </span>
      )}
    </header>
    {snippets.length ? (
      <ul className="home-list stagger">
        {snippets.map((item, index) => (
          <li key={item.id} className="home-list-item">
            <span className={`home-list-rank ${index < 3 ? 'home-list-rank--top' : ''}`}>
              {index + 1}
            </span>
            <div className="home-list-content">
              <Link
                to={`/code/${item.id}?from=home`}
                className="home-list-text"
                title={item.title}
                onClick={() =>
                  trackHomeClick({
                    module: 'hot_snippets',
                    targetType: 'snippet',
                    targetId: item.id,
                    targetTitle: item.title
                  })
                }
              >
                {item.title}
              </Link>
              <span className="home-list-sub">{item.subtitle}</span>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <Empty description="暂无组件数据" />
    )}
  </section>
);
