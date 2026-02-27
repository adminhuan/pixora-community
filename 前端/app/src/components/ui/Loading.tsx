interface LoadingProps {
  text?: string;
}

export const Loading = ({ text = '加载中...' }: LoadingProps) => (
  <div className="apc-loading">
    <span className="apc-loading-spinner" />
    {text}
  </div>
);
