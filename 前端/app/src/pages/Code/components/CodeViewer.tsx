import { CodeBlock } from '../../../components/shared/CodeBlock';

interface CodeViewerProps {
  code: string;
  language?: string;
  filename?: string;
  maxHeight?: number;
}

export const CodeViewer = ({ code, language, filename, maxHeight }: CodeViewerProps) => (
  <CodeBlock code={code} language={language} filename={filename} maxHeight={maxHeight} />
);
