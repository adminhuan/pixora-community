import { useEffect } from 'react';

export const useInfiniteScroll = (callback: () => void, canLoad = true, offset = 200) => {
  useEffect(() => {
    const handleScroll = () => {
      if (!canLoad) {
        return;
      }

      const reachedBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - offset;
      if (reachedBottom) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, canLoad, offset]);
};
