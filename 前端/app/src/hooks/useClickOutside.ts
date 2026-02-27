import { useEffect, type RefObject } from 'react';

export const useClickOutside = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutsideClick: () => void,
) => {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    };

    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onOutsideClick, ref]);
};
