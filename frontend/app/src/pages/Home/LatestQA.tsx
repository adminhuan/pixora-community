import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Empty } from '../../components/ui';
import { trackHomeClick } from '../../utils';

interface QAItem {
  id: string;
  title: string;
  status: string;
}

interface LatestQAProps {
  list: QAItem[];
}

const statusVariant = (status: string) => {
  if (status === '已解决') return 'success' as const;
  if (status === '待处理') return 'warning' as const;
  return 'default' as const;
};

export const LatestQA = ({ list }: LatestQAProps) => (
  <section className="home-section animate-fade-in">
    <header className="home-section-header">
      <h3 className="home-section-title">
        <span className="home-section-icon home-section-icon--qa"><HelpCircle size={16} /></span>
        最新问答
      </h3>
      <span className="home-section-extra">问题追踪</span>
    </header>
    {list.length ? (
      <div className="home-list stagger">
        {list.map((item, index) => (
          <div key={item.id} className="home-list-item home-list-item--between">
            <div className="home-list-left">
              <span className="home-list-rank home-list-rank--qa">Q{index + 1}</span>
              <Link
                to={`/qa/${item.id}?from=home`}
                className="home-list-text"
                title={item.title}
                onClick={() =>
                  trackHomeClick({
                    module: 'latest_qa',
                    targetType: 'question',
                    targetId: item.id,
                    targetTitle: item.title
                  })
                }
              >
                {item.title}
              </Link>
            </div>
            <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
          </div>
        ))}
      </div>
    ) : (
      <Empty description="暂无问答数据" />
    )}
  </section>
);
