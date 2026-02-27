import { useMemo } from 'react';

interface ComponentPreviewProps {
  html: string;
  css: string;
  js?: string;
  interactive?: boolean;
}

export const ComponentPreview = ({ html, css, js, interactive }: ComponentPreviewProps) => {
  const srcdoc = useMemo(
    () =>
      `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a2e;font-family:Inter,'Noto Sans SC','PingFang SC',system-ui,sans-serif}${css}</style></head><body>${html}${js ? `<script>${js}</script>` : ''}</body></html>`,
    [html, css, js],
  );

  return (
    <div className="cg-preview">
      <iframe
        srcDoc={srcdoc}
        sandbox={`allow-scripts${interactive ? ' allow-forms' : ''}`}
        title="Component preview"
        className="cg-preview-iframe"
      />
    </div>
  );
};
