import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollableElement = useRef<HTMLDivElement | null>(null);
  const canPullRef = useRef(false);

  useEffect(() => {
    const element = scrollableElement.current;
    if (!element) return;

    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if we're at the top of the scroll
      if (element.scrollTop <= 500 && !isRefreshing) {
        startY = e.touches[0].clientY;
        touchStartY.current = startY;
        canPullRef.current = true;
      } else {
        canPullRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPullRef.current || isRefreshing) return;

      currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      // Only pull down and only if still at top
      if (distance > 0 && element.scrollTop <= 0) {
        // Apply resistance
        const resistedDistance = distance / resistance;
        setPullDistance(resistedDistance);
      } else {
        // // If scrolled away from top, stop pull
        // canPullRef.current = false;
        // setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!canPullRef.current) {
        setPullDistance(0);
        return;
      }

      canPullRef.current = false;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, threshold, resistance, onRefresh, isRefreshing]);

  return {
    pullDistance,
    isRefreshing,
    scrollableElement,
  };
}
