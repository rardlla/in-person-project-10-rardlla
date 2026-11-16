
import { useEffect, useRef, useCallback } from 'react';

export function usePolling(callback, interval = 30000, enabled = true) {
  const callbackRef = useRef(callback);

  // Always use the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Manual refresh
  const refresh = useCallback(() => {
    return callbackRef.current();
  }, []);

  // Automatic polling
  useEffect(() => {
    if (!enabled) return;

    // Make an immediate first call
    refresh();

    // Repeat at the specified interval
    const intervalId = setInterval(() => {
      refresh();
    }, interval);

    // Clean up when unmounted or settings change
    return () => {
      clearInterval(intervalId);
    };
  }, [interval, enabled, refresh]);

  return { refresh };
}
