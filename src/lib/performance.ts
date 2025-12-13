/**
 * Performance monitoring utilities
 * Only active in development mode
 */

const isDevelopment = import.meta.env.DEV;

export const performanceMonitor = {
  /**
   * Measure function execution time
   */
  measure: (label: string, fn: () => void | Promise<void>) => {
    if (!isDevelopment) {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
      });
    } else {
      const end = performance.now();
      console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
  },

  /**
   * Mark a performance milestone
   */
  mark: (label: string) => {
    if (isDevelopment && 'mark' in performance) {
      performance.mark(label);
    }
  },

  /**
   * Measure between two marks
   */
  measureBetween: (name: string, startMark: string, endMark: string) => {
    if (isDevelopment && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
      } catch (error) {
        // Silently fail if marks don't exist
      }
    }
  },
};

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

