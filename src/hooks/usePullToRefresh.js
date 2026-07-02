import { useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh, containerRef) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const el = containerRef?.current || document.body;
    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };
    const handleTouchEnd = async (e) => {
      if (pulling.current) {
        const dy = e.changedTouches[0].clientY - startY.current;
        pulling.current = false;
        if (dy > 80) {
          setIsRefreshing(true);
          try {
            await onRefresh();
          } finally {
            setIsRefreshing(false);
          }
        }
      }
    };
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, containerRef]);

  return { isRefreshing };
}