import { Button } from './Button';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (nextPage: number) => void;
}

export const Pagination = ({ page, pageSize, total, onChange }: PaginationProps) => {
  const totalPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="cp-pagination">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        上一页
      </Button>
      <span className="cp-pagination-info">
        {page} / {totalPage}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPage} onClick={() => onChange(page + 1)}>
        下一页
      </Button>
    </div>
  );
};
