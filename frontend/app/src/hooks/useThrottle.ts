import { useEffect, useRef, useState } from 'react';

export const useThrottle = <T>(value: T, delay = 200) => {
  const [throttled, setThrottled] = useState(value);
  const lastRun = useRef(0);

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastRun.current;
    const wait = elapsed >= delay ? 0 : delay - elapsed;

    const timer = window.setTimeout(() => {
      setThrottled(value);
      lastRun.current = Date.now();
    }, wait);

    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return throttled;
};
