'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';

/**
 * Hook to sync a primitive state value (string, number, boolean) with a URL search parameter.
 * Maintains instantaneous localized React rendering while updating URL via router.replace({ scroll: false }).
 */
export function useUrlFilter(key, defaultValue, debounceMs = 0) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parseUrlValue = useCallback((val) => {
    if (val === null || val === undefined || val === '') return defaultValue;
    if (typeof defaultValue === 'number') {
      const parsed = Number(val);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    if (typeof defaultValue === 'boolean') {
      return val === 'true' || val === '1';
    }
    return val;
  }, [defaultValue]);

  const [localValue, setLocalValue] = useState(() => {
    let initialParam = null;
    if (searchParams && typeof searchParams.get === 'function') {
      initialParam = searchParams.get(key);
    }
    if (initialParam === null && typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      initialParam = sp.get(key);
    }
    return parseUrlValue(initialParam);
  });

  const timeoutRef = useRef(null);

  // Synchronize state from browser navigation (e.g. back/forward button clicks)
  useEffect(() => {
    let urlValue = null;
    if (searchParams && typeof searchParams.get === 'function') {
      urlValue = searchParams.get(key);
    } else if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      urlValue = sp.get(key);
    }
    const parsed = parseUrlValue(urlValue);
    if (parsed !== localValue) {
      setLocalValue(parsed);
    }
  }, [searchParams, key, parseUrlValue]);

  const setValue = useCallback((newValueOrUpdater) => {
    setLocalValue((prevValue) => {
      const newValue = typeof newValueOrUpdater === 'function' ? newValueOrUpdater(prevValue) : newValueOrUpdater;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (typeof window === 'undefined') return;
        const currentParams = new URLSearchParams(window.location.search);

        if (
          newValue !== undefined &&
          newValue !== null &&
          newValue !== '' &&
          newValue !== defaultValue &&
          newValue !== 'ALL' &&
          newValue !== 'All' &&
          newValue !== 'all'
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
  }, [key, pathname, router, defaultValue, debounceMs]);

  return [localValue, setValue];
}

/**
 * Hook to sync a composite object state (e.g., filter arrays and sort properties) with multiple URL search parameters.
 */
export function useUrlFilterObject(defaultObject, debounceMs = 0) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef(null);
  const defaultRef = useRef(defaultObject);

  const parseObjectFromUrl = useCallback(() => {
    const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const result = { ...defaultRef.current };
    
    Object.keys(defaultRef.current).forEach((key) => {
      let val = null;
      if (searchParams && typeof searchParams.get === 'function') {
        val = searchParams.get(key);
      }
      if (val === null && sp) {
        val = sp.get(key);
      }

      // Handle legacy/singular fallback for vendors -> vendor
      if (val === null && key === 'vendors') {
        if (searchParams && typeof searchParams.get === 'function') {
          val = searchParams.get('vendor');
        }
        if (val === null && sp) {
          val = sp.get('vendor');
        }
      }

      const defaultVal = defaultRef.current[key];
      if (Array.isArray(defaultVal)) {
        if (val && val !== '') {
          result[key] = val.split(',').map((s) => s.trim()).filter(Boolean);
        } else {
          result[key] = defaultVal;
        }
      } else if (typeof defaultVal === 'number') {
        result[key] = val !== null && val !== '' ? Number(val) : defaultVal;
      } else {
        result[key] = val !== null && val !== '' ? val : defaultVal;
      }
    });

    return result;
  }, [searchParams]);

  const [localObject, setLocalObject] = useState(parseObjectFromUrl);

  // Sync state when URL changes via history navigation (Back/Forward)
  useEffect(() => {
    const nextObject = parseObjectFromUrl();
    setLocalObject((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(nextObject)) {
        return nextObject;
      }
      return prev;
    });
  }, [searchParams, parseObjectFromUrl]);

  const setFilterObject = useCallback((newValueOrUpdater) => {
    setLocalObject((prevValue) => {
      const newValue = typeof newValueOrUpdater === 'function' ? newValueOrUpdater(prevValue) : newValueOrUpdater;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (typeof window === 'undefined') return;
        const currentParams = new URLSearchParams(window.location.search);

        Object.keys(newValue).forEach((key) => {
          const val = newValue[key];
          const defaultVal = defaultRef.current[key];

          if (Array.isArray(val)) {
            if (val.length > 0) {
              currentParams.set(key, val.join(','));
              if (key === 'vendors') currentParams.delete('vendor'); // clean up duplicate singular param
            } else {
              currentParams.delete(key);
              if (key === 'vendors') currentParams.delete('vendor');
            }
          } else if (
            val !== undefined &&
            val !== null &&
            val !== '' &&
            val !== defaultVal &&
            val !== 'ALL' &&
            val !== 'All' &&
            val !== 'all'
          ) {
            currentParams.set(key, String(val));
          } else {
            currentParams.delete(key);
          }
        });

        const qs = currentParams.toString();
        const newUrl = qs ? `${pathname}?${qs}` : pathname;
        router.replace(newUrl, { scroll: false });
      }, debounceMs);

      return newValue;
    });
  }, [pathname, router, debounceMs]);

  return [localObject, setFilterObject];
}
