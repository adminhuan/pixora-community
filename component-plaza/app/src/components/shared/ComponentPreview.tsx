import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { SnippetFile } from '../../types/common';

interface ComponentPreviewProps {
  files: SnippetFile[];
  height?: number;
  framework?: string;
  lazy?: boolean;
}

const BASE_STYLE = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden!important;height:100%!important;min-height:100%!important}
body{display:flex;align-items:center;justify-content:center;background:#0B1120;color:#e2e8f0;font-family:Inter,'Noto Sans SC','PingFang SC',system-ui,-apple-system,sans-serif}`;

const TAILWIND_CDN = '<script src="https://cdn.tailwindcss.com"></script>';

const REACT_CDNS = `<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`;

const ComponentPreviewInner = ({ files, height = 200, framework = 'css', lazy = true }: ComponentPreviewProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(!lazy);

  useEffect(() => {
    if (!lazy || ready) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setReady(true);
      return;
    }

    const target = wrapperRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: '180px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [lazy, ready]);

  const srcDoc = useMemo(() => {
    if (!ready) {
      return '';
    }

    const htmlFile = files.find((f) => f.language === 'html' || f.filename.endsWith('.html'));
    const cssFile = files.find((f) => f.language === 'css' || f.filename.endsWith('.css'));
    const jsFile = files.find(
      (f) =>
        f.language === 'javascript' ||
        f.language === 'typescript' ||
        f.filename.endsWith('.js') ||
        f.filename.endsWith('.jsx') ||
        f.filename.endsWith('.tsx'),
    );

    const html = htmlFile?.content ?? '';
    const css = cssFile?.content ?? '';
    const js = jsFile?.content ?? '';

    const headExtras: string[] = [];
    let bodyScript = '';

    if (framework === 'tailwind') {
      headExtras.push(TAILWIND_CDN);
      headExtras.push(`<script>tailwind.config={darkMode:'class',theme:{extend:{}}}</script>`);
    }

    if (framework === 'react') {
      headExtras.push(REACT_CDNS);
      const rootHtml = html.trim() || '<div id="root"></div>';
      const jsxCode =
        js.trim() || `
const App = () => <div style={{padding:'20px',textAlign:'center'}}>
  <h2>React Component</h2>
  <p>Edit the code on the left</p>
</div>;
ReactDOM.createRoot(document.getElementById('root')).render(<App />);`;

      return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${headExtras.join('\n')}
<style>${BASE_STYLE}\n${css}</style>
</head>
<body>
${rootHtml}
<script type="text/babel" data-type="module">${jsxCode}</script>
</body>
</html>`;
    }

    if (js) {
      bodyScript = `<script>${js}</script>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${headExtras.join('\n')}
<style>${BASE_STYLE}\n${css}</style>
</head>
<body>
${html}
${bodyScript}
</body>
</html>`;
  }, [files, framework, ready]);

  return (
    <div ref={wrapperRef} className="cp-preview-shell" style={{ height }}>
      {ready ? (
        <iframe
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          scrolling="no"
          loading="lazy"
          className="cp-preview-iframe"
          style={{ height: '100%', overflow: 'hidden' }}
          title="组件预览"
        />
      ) : (
        <div className="cp-preview-skeleton" aria-label="预览加载中" />
      )}
    </div>
  );
};

ComponentPreviewInner.displayName = 'ComponentPreviewInner';
export const ComponentPreview = memo(ComponentPreviewInner);
