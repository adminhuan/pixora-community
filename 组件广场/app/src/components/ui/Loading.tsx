interface LoadingProps {
  text?: string;
}

export const Loading = ({ text = '加载中...' }: LoadingProps) => (
  <div className="cp-loading">
    <span className="cp-loading-spinner" />
    {text}
  </div>
);
