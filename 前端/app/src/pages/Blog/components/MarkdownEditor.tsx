import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { MarkdownRenderer } from '../../../components/shared/MarkdownRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onInsertImage?: () => void;
  uploading?: boolean;
}

export interface MarkdownEditorHandle {
  insertAtCursor: (text: string) => void;
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  ({ value, onChange, onInsertImage, uploading }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mode, setMode] = useState<'write' | 'preview' | 'split'>('split');

    const insertAtCursor = (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        onChange(value + text);
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = value.slice(0, start);
      const after = value.slice(end);
      const needNewlineBefore = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
      const needNewlineAfter = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
      const newValue = before + needNewlineBefore + text + needNewlineAfter + after;
      onChange(newValue);
      requestAnimationFrame(() => {
        const pos = start + needNewlineBefore.length + text.length;
        textarea.focus();
        textarea.setSelectionRange(pos, pos);
      });
    };

    useImperativeHandle(ref, () => ({ insertAtCursor }));

    const insertFormat = (prefix: string, suffix = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end);
      const replacement = prefix + (selected || '文本') + suffix;
      const newValue = value.slice(0, start) + replacement + value.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        const newStart = start + prefix.length;
        const newEnd = newStart + (selected || '文本').length;
        textarea.focus();
        textarea.setSelectionRange(newStart, newEnd);
      });
    };

    const toolbar = (
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '6px 8px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-primaryBg)',
          borderRadius: '8px 8px 0 0',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <button type="button" className="editor-btn" title="加粗" onClick={() => insertFormat('**', '**')}>
          <strong>B</strong>
        </button>
        <button type="button" className="editor-btn" title="斜体" onClick={() => insertFormat('*', '*')}>
          <em>I</em>
        </button>
        <button type="button" className="editor-btn" title="标题" onClick={() => insertFormat('## ')}>
          H
        </button>
        <button type="button" className="editor-btn" title="引用" onClick={() => insertFormat('> ')}>
          &ldquo;
        </button>
        <button type="button" className="editor-btn" title="代码" onClick={() => insertFormat('`', '`')}>
          &lt;/&gt;
        </button>
        <button type="button" className="editor-btn" title="链接" onClick={() => insertFormat('[', '](url)')}>
          🔗
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />
        <button
          type="button"
          className="editor-btn"
          title="插入图片"
          onClick={onInsertImage}
          disabled={uploading}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {uploading ? '上传中...' : '📷 插入图片'}
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 2 }}>
          {(['write', 'split', 'preview'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className="editor-btn"
              onClick={() => setMode(m)}
              style={{
                background: mode === m ? 'var(--color-primary)' : undefined,
                color: mode === m ? '#fff' : undefined,
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 12,
              }}
            >
              {{ write: '编辑', split: '分栏', preview: '预览' }[m]}
            </button>
          ))}
        </div>
      </div>
    );

    return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        {toolbar}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: mode === 'split' ? '1fr 1fr' : '1fr',
            minHeight: 360,
          }}
        >
          {mode !== 'preview' && (
            <textarea
              ref={textareaRef}
              className="textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="支持 Markdown 语法，可通过工具栏插入图片"
              style={{
                border: 'none',
                borderRadius: 0,
                resize: 'vertical',
                minHeight: 360,
                borderRight: mode === 'split' ? '1px solid var(--color-border)' : undefined,
                fontFamily: 'monospace',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            />
          )}
          {mode !== 'write' && (
            <div
              style={{
                padding: 16,
                overflow: 'auto',
                minHeight: 360,
                maxHeight: 600,
                background: mode === 'preview' ? undefined : 'var(--color-primaryBg)',
              }}
            >
              {value.trim() ? (
                <MarkdownRenderer content={value} />
              ) : (
                <span style={{ color: 'var(--color-textSecondary)', fontSize: 14 }}>预览区域</span>
              )}
            </div>
          )}
        </div>
        <style>{`
          .editor-btn {
            border: none;
            background: none;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
            color: var(--color-text);
            line-height: 1;
          }
          .editor-btn:hover {
            background: var(--color-border);
          }
          .editor-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  },
);

MarkdownEditor.displayName = 'MarkdownEditor';
