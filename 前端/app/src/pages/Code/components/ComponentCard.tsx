import { Eye, Heart } from 'lucide-react';

interface ComponentCardProps {
  title: string;
  html: string;
  css: string;
  author: string;
  views: number;
  likes: number;
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

const buildSrcdoc = (html: string, css: string) =>
  `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a2e;font-family:Inter,'Noto Sans SC','PingFang SC',system-ui,sans-serif;overflow:hidden}${css}</style></head><body>${html}</body></html>`;

export const ComponentCard = ({ title, html, css, author, views, likes }: ComponentCardProps) => (
  <div className="cg-card">
    <div className="cg-card-preview">
      {html || css ? (
        <iframe
          srcDoc={buildSrcdoc(html, css)}
          sandbox="allow-scripts"
          title={title}
          className="cg-card-iframe"
          loading="lazy"
        />
      ) : (
        <div className="cg-card-placeholder" />
      )}
    </div>
    <div className="cg-card-footer">
      <span className="cg-card-author">{author}</span>
      <div className="cg-card-stats">
        <span className="cg-card-stat"><Eye size={13} /> {fmt(views)}</span>
        <span className="cg-card-stat"><Heart size={13} /> {fmt(likes)}</span>
      </div>
    </div>
  </div>
);
