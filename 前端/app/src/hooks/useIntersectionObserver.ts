import { useEffect, type RefObject } from 'react';

export const useIntersectionObserver = (
  target: RefObject<Element | null>,
  onIntersect: () => void,
  options?: IntersectionObserverInit,
) => {
  useEffect(() => {
    if (!target.current) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onIntersect();
        }
      });
    }, options);

    observer.observe(target.current);
    return () => observer.disconnect();
  }, [target, onIntersect, options]);
};
