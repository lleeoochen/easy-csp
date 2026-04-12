import { useEffect, useState, useRef } from 'react';

export const useHideOnScroll = (threshold = 10, resetDependency?: any) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isAtBottom = useRef(false);

  // Reset visibility when resetDependency changes (e.g., route change)
  useEffect(() => {
    setIsVisible(true);
    lastScrollY.current = 0;
    isAtBottom.current = false;
  }, [resetDependency]);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;

      // Get scroll position from the scrolling element
      const currentScrollY = target.scrollTop || window.scrollY;

      // Check if we're at the bottom of the scrollable area
      const scrollHeight = target.scrollHeight || document.documentElement.scrollHeight;
      const clientHeight = target.clientHeight || window.innerHeight;
      const atBottom = currentScrollY + clientHeight >= scrollHeight - 10;

      // If we're at the bottom and bouncing back, don't show nav
      if (atBottom) {
        isAtBottom.current = true;
        // Keep nav hidden when at bottom
        if (!isVisible) {
          return;
        }
      } else {
        isAtBottom.current = false;
      }

      // Show nav when scrolling up or at top (but not when bouncing at bottom)
      if (currentScrollY < lastScrollY.current || currentScrollY < threshold) {
        if (!isAtBottom.current) {
          setIsVisible(true);
        }
      }
      // Hide nav when scrolling down
      else if (currentScrollY > lastScrollY.current && currentScrollY > threshold) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    // Listen to scroll events on the document (captures all scroll events)
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold, isVisible]);

  return isVisible;
};
