import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

interface InfiniteScrollProps {
  onLoadMore: () => void;
  disabled?: boolean;
}

export const InfiniteScroll = ({ children, onLoadMore, disabled }: PropsWithChildren<InfiniteScrollProps>) => {
  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disabled || !triggerRef.current) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      });
    });

    observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [disabled, onLoadMore]);

  return (
    <div>
      {children}
      <div ref={triggerRef} style={{ height: 2 }} />
    </div>
  );
};
