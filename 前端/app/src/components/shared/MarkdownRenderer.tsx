import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { resolveSafeImageSrc, resolveSafeUrl, sanitizeText } from '../../utils';

interface MarkdownRendererProps {
  content: string;
}

const resolveLinkHref = (href: string) => {
  const value = resolveSafeUrl(href, {
    allowRelative: true,
    allowMailTo: true,
    allowTel: true,
    allowHash: true
  });

  return value || '#';
};

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => (
  <article style={{ lineHeight: 1.7 }}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        img: ({ src, alt }) => {
          const safeSrc = resolveSafeImageSrc(String(src ?? ''), { allowDataImage: true, allowRelative: true });
          if (!safeSrc) {
            return null;
          }

          return (
            <img
              src={safeSrc}
              alt={String(alt ?? '')}
              loading="lazy"
              style={{
                display: 'block',
                maxWidth: '100%',
                width: 'auto',
                maxHeight: 520,
                height: 'auto',
                margin: '10px auto',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
                background: 'var(--color-primaryBg)'
              }}
            />
          );
        },
        a: ({ href, children }) => (
          <a href={resolveLinkHref(String(href ?? ''))} target="_blank" rel="noopener noreferrer nofollow">
            {children}
          </a>
        )
      }}
    >
      {sanitizeText(content)}
    </ReactMarkdown>
  </article>
);
