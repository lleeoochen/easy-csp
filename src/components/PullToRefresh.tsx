import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className = '',
}: PullToRefreshProps) {
  const { pullDistance, isRefreshing, scrollableElement } = usePullToRefresh({
    onRefresh,
    threshold,
  });

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;
  const opacity = Math.min(progress * 1.5, 1);

  return (
    <div
      ref={scrollableElement}
      className={`relative h-full overflow-y-auto ${className}`}
      style={{ overscrollBehavior: 'none' }}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-[env(safe-area-inset-top)] left-0 right-0 flex justify-center items-center transition-opacity z-50"
        style={{
          height: `${Math.min(pullDistance, threshold)}px`,
          opacity: isRefreshing ? 1 : opacity,
          pointerEvents: 'none',
        }}
      >
        <div className="bg-white rounded-full p-2 shadow-lg">
          <RefreshCw
            size={24}
            className={`text-primary-bg ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
              transition: isRefreshing ? undefined : 'transform 0.1s ease-out',
            }}
          />
        </div>
      </div>

      {/* Overlay during refresh */}
      {isRefreshing && (
        <div
          className="absolute top-0 left-0 right-0 bottom-0 bg-background/10 backdrop-blur-[2px] z-40 pointer-events-none"
          style={{
            transition: 'opacity 0.2s ease-in-out',
          }}
        />
      )}

      {/* Content with padding when pulling */}
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
