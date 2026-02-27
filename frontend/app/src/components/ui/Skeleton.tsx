interface SkeletonProps {
  height?: number;
  width?: string;
}

export const Skeleton = ({ height = 16, width = '100%' }: SkeletonProps) => (
  <div
    className="apc-skeleton"
    style={{ height, width }}
  />
);
