import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useCopyToClipboard } from '../../hooks';

interface CodeFile {
  filename: string;
  language?: string;
  code: string;
}

interface CodeBlockProps {
  /** Single file mode */
  language?: string;
  code?: string;
  filename?: string;
  /** Multi-file mode */
  files?: CodeFile[];
  /** Max height for the code panel (default: none) */
  maxHeight?: number;
}

const addLineNumbers = (code: string) => {
  const lines = code.split('\n');
  return lines.map((line, i) => (
    <div key={i} className="vsc-line">
      <span className="vsc-line-num">{i + 1}</span>
      <span className="vsc-line-code">{line || ' '}</span>
    </div>
  ));
};

export const CodeBlock = ({ language = 'text', code = '', filename, files, maxHeight }: CodeBlockProps) => {
  const { copied, copy } = useCopyToClipboard();

  const fileList: CodeFile[] = files ?? [{ filename: filename ?? `snippet.${language}`, language, code }];
  const [activeIdx, setActiveIdx] = useState(0);
  const current = fileList[activeIdx] ?? fileList[0];

  return (
    <div className="vsc-window">
      <div className="vsc-titlebar">
        <span className="vsc-titlebar-text">{current.filename}</span>
        <div className="vsc-controls">
          <span className="vsc-dot vsc-dot--close" />
          <span className="vsc-dot vsc-dot--min" />
          <span className="vsc-dot vsc-dot--max" />
        </div>
      </div>

      {fileList.length > 1 && (
        <div className="vsc-tabs">
          {fileList.map((file, idx) => (
            <button
              key={file.filename}
              type="button"
              className={`vsc-tab${idx === activeIdx ? ' vsc-tab--active' : ''}`}
              onClick={() => setActiveIdx(idx)}
            >
              {file.filename}
            </button>
          ))}
        </div>
      )}

      <div className="vsc-body">
        <button
          type="button"
          className={`vsc-copy${copied ? ' vsc-copy--done' : ''}`}
          onClick={() => copy(current.code)}
        >
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </button>
        <div className="vsc-code" style={maxHeight ? { maxHeight } : undefined}>
          <pre className="vsc-pre">
            <code>{addLineNumbers(current.code)}</code>
          </pre>
        </div>
      </div>

      <div className="vsc-footer">
        <span className="vsc-lang">{current.language ?? language}</span>
        <span className="vsc-line-info">Lines: {current.code.split('\n').length}</span>
      </div>
    </div>
  );
};
