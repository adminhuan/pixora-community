import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { resolveSafeUrl } from '../../utils/safe-url';

type SafeMarkdownProps = {
  content: string;
  style?: CSSProperties;
};

const sanitizeMarkdown = (value: string): string => {
  return DOMPurify.sanitize(String(value ?? ''), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

export const SafeMarkdown = ({ content, style }: SafeMarkdownProps) => {
  const safeMarkdown = useMemo(() => sanitizeMarkdown(content), [content]);

  return (
    <div
      style={{
        lineHeight: 1.8,
        fontSize: 15,
        color: '#374151',
        wordBreak: 'break-word',
        maxWidth: '100%',
        overflow: 'hidden',
        ...style
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) => {
            const safeSrc = resolveSafeUrl(String(src ?? ''), {
              allowMailTo: false,
              allowTel: false
            });

            if (!safeSrc) {
              return null;
            }

            return (
              <img
                src={safeSrc}
                alt={String(alt ?? '')}
                loading="lazy"
                style={{
                  maxWidth: '100%',
                  borderRadius: 8,
                  margin: '8px 0',
                  display: 'block'
                }}
              />
            );
          },
          a: ({ href, children }) => {
            const safeHref = resolveSafeUrl(String(href ?? ''));
            if (!safeHref) {
              return <span>{children}</span>;
            }

            return (
              <a href={safeHref} target="_blank" rel="noopener noreferrer nofollow">
                {children}
              </a>
            );
          }
        }}
      >
        {safeMarkdown}
      </ReactMarkdown>
    </div>
  );
};
