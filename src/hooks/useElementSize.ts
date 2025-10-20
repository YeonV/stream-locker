import { useState, useLayoutEffect, useCallback } from 'react';

interface Size {
  width: number;
  height: number;
}

export const useElementSize = (): [(node: HTMLElement | null) => void, Size] => {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  const ref = useCallback((node: HTMLElement | null) => {
    setNode(node);
  }, []);

  useLayoutEffect(() => {
    if (node) {
      const measure = () => {
        const { width, height } = node.getBoundingClientRect();
        setSize({ width, height });
      };
      
      measure();

      const resizeObserver = new ResizeObserver(() => measure());
      resizeObserver.observe(node);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [node]);

  return [ref, size];
};