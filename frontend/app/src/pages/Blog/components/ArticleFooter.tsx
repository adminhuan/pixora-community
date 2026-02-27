import { FavoriteButton, LikeButton, ShareButton } from '../../../components/shared';

interface ArticleFooterProps {
  title?: string;
  summary?: string;
}

export const ArticleFooter = ({ title, summary }: ArticleFooterProps) => (
  <div className="button-row">
    <LikeButton count={96} />
    <FavoriteButton count={42} />
    <ShareButton title={title} summary={summary} contentType="技术博客" />
  </div>
);
