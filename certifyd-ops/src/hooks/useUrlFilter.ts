'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';

export function useUrlFilter<T extends string | number>(
  key: string,
  defaultValue: T,
  debounceMs: number = 0
): [T, (val: T | ((prev: T) => T)) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Convert URL string back to number if defaultValue is a number
  const parseUrlValue = (val: string | null): T => {
    if (val === null) return defaultValue;
    if (typeof defaultValue === 'number') {
      const parsed = Number(val);
      return (isNaN(parsed) ? defaultValue : parsed) as T;
    }
    return val as T;
  };
  
  const [localValue, setLocalValue] = useState<T>(parseUrlValue(searchParams.get(key)));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync from URL changes (like back/forward buttons)
  useEffect(() => {
    const urlValue = searchParams.get(key);
    const parsedUrlValue = parseUrlValue(urlValue);
    if (parsedUrlValue !== localValue) {
      setLocalValue(parsedUrlValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get(key)]);

  const setValue = useCallback(
    (newValueOrUpdater: T | ((prev: T) => T)) => {
      setLocalValue((prevValue) => {
        const newValue = typeof newValueOrUpdater === 'function' ? (newValueOrUpdater as any)(prevValue) : newValueOrUpdater;
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          // Read directly from window to avoid overriding concurrent updates
          const currentParams = new URLSearchParams(window.location.search);
          
          if (
            newValue !== undefined && 
            newValue !== null && 
            newValue !== '' &&
            newValue !== defaultValue && 
            newValue !== 'ALL' && 
            newValue !== 'All'
          ) {
            currentParams.set(key, String(newValue));
          } else {
            currentParams.delete(key);
          }
          
          const qs = currentParams.toString();
          const newUrl = qs ? `${pathname}?${qs}` : pathname;
          router.replace(newUrl, { scroll: false });
        }, debounceMs);

        return newValue;
      });
    },
    [key, pathname, router, defaultValue, debounceMs]
  );

  return [localValue, setValue];
}
