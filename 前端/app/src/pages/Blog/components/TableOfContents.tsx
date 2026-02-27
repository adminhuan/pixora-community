interface TableOfContentsProps {
  headings: Array<{ id: string; title: string }>;
}

export const TableOfContents = ({ headings }: TableOfContentsProps) => (
  <nav style={{ display: 'grid', gap: 8 }}>
    {headings.map((heading) => (
      <a key={heading.id} href={`#${heading.id}`} style={{ color: 'var(--color-textSecondary)', fontSize: 13 }}>
        {heading.title}
      </a>
    ))}
  </nav>
);
