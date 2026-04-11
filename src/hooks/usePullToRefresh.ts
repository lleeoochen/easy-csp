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
  const pullDistanceRef = useRef(0);

  // Keep ref in sync with state
  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    const element = scrollableElement.current;
    if (!element) return;

    let startY = 0;
    let startX = 0;
    let currentY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if we're at the top of the scroll
      if (element.scrollTop <= 500 && !isRefreshing) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        touchStartY.current = startY;
        canPullRef.current = true;
        isPulling = false;
      } else {
        canPullRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPullRef.current || isRefreshing) return;

      currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startY;
      const deltaX = Math.abs(currentX - startX);

      // Determine if this is a vertical or horizontal gesture
      if (!isPulling && Math.abs(deltaY) > 5) {
        // Check if movement is more vertical than horizontal
        if (Math.abs(deltaY) > deltaX * 1.5) {
          isPulling = true;
        } else {
          // Horizontal movement detected, disable pull-to-refresh for this gesture
          canPullRef.current = false;
          return;
        }
      }

      // Only pull down if we've determined this is a vertical gesture
      if (isPulling && deltaY > 0 && element.scrollTop <= 0) {
        // Apply resistance
        const resistedDistance = deltaY / resistance;
        setPullDistance(resistedDistance);
      }
    };

    const handleTouchEnd = async () => {
      if (!canPullRef.current) {
        setPullDistance(0);
        return;
      }

      canPullRef.current = false;

      if (pullDistanceRef.current >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);

        try {
          await onRefresh();
          // Keep spinner visible for a bit longer for better UX
          await new Promise(resolve => setTimeout(resolve, 200));
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
  }, [threshold, resistance, onRefresh, isRefreshing]);

  return {
    pullDistance,
    isRefreshing,
    scrollableElement,
  };
}
