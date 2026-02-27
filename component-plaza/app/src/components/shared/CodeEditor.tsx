import { useRef, useState, useCallback } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  minHeight?: number;
}

export const CodeEditor = ({ value, onChange, language = 'text', placeholder, minHeight = 320 }: CodeEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const lines = value.split('\n');
  const lineCount = lines.length;

  const handleScroll = useCallback(() => {
    if (textareaRef.current) {
      setScrollTop(textareaRef.current.scrollTop);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="vsc-editor" style={{ minHeight }}>
      <div className="vsc-editor-gutter" style={{ transform: `translateY(-${scrollTop}px)` }}>
        {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
          <div key={i} className="vsc-editor-line-num">
            {i < lineCount ? i + 1 : ''}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="vsc-editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        data-language={language}
      />
    </div>
  );
};
