interface EmptyProps {
  description?: string;
}

export const Empty = ({ description = '暂无数据' }: EmptyProps) => (
  <div className="cp-empty">{description}</div>
);
