import { useEffect, useRef } from 'react';

export function usePullToRefresh(onRefresh, containerRef) {
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    const el = containerRef?.current || document.body;
    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };
    const handleTouchEnd = (e) => {
      if (pulling.current) {
        const dy = e.changedTouches[0].clientY - startY.current;
        if (dy > 80) onRefresh();
        pulling.current = false;
      }
    };
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, containerRef]);
}