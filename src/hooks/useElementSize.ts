import { useState, useLayoutEffect, useCallback } from 'react';

// NEW: Updated interface to include margins
interface ElementMetrics {
  width: number;
  height: number;
  marginLeft: number;
  marginRight: number;
}

export const useElementSize = (): [(node: HTMLElement | null) => void, ElementMetrics] => {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [metrics, setMetrics] = useState<ElementMetrics>({
    width: 0,
    height: 0,
    marginLeft: 0,
    marginRight: 0,
  });

  const ref = useCallback((node: HTMLElement | null) => {
    setNode(node);
  }, []);

  useLayoutEffect(() => {
    if (node) {
      const measure = () => {
        const rect = node.getBoundingClientRect();
        const styles = window.getComputedStyle(node);
        
        setMetrics({
          width: rect.width,
          height: rect.height,
          // Parse the margin strings (e.g., "8px") into numbers
          marginLeft: parseFloat(styles.marginLeft),
          marginRight: parseFloat(styles.marginRight),
        });
      };
      
      measure();
      const resizeObserver = new ResizeObserver(() => measure());
      resizeObserver.observe(node);
      return () => resizeObserver.disconnect();
    }
  }, [node]);

  return [ref, metrics];
};