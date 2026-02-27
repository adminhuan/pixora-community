import { MarkdownRenderer } from '../../../components/shared/MarkdownRenderer';

interface PostContentProps {
  content: string;
}

export const PostContent = ({ content }: PostContentProps) => <MarkdownRenderer content={content} />;
