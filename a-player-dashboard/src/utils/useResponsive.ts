import { useState, useEffect } from 'react';

// Breakpoints following Tailwind CSS conventions
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export interface ScreenInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const useResponsive = (): ScreenInfo => {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() => {
    if (typeof window === 'undefined') {
      // SSR fallback
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLarge: false,
        breakpoint: 'lg'
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isMobile: width < breakpoints.md,
      isTablet: width >= breakpoints.md && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg,
      isLarge: width >= breakpoints.xl,
      breakpoint: getBreakpoint(width)
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenInfo({
        width,
        height,
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg,
        isLarge: width >= breakpoints.xl,
        breakpoint: getBreakpoint(width)
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Call once to set initial state
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenInfo;
};

const getBreakpoint = (width: number): 'sm' | 'md' | 'lg' | 'xl' | '2xl' => {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  return 'sm';
};

// Helper hook for chart heights based on screen size
export const useChartHeight = (baseHeight: number = 500): number => {
  const { isMobile, isTablet } = useResponsive();
  
  if (isMobile) return Math.max(300, baseHeight * 0.7);
  if (isTablet) return Math.max(350, baseHeight * 0.8);
  return baseHeight;
}; 