"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function useUrlState(key, initialValue) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL or initialValue
  // Logic: specific key > initialValue
  const getInitialState = () => {
    const paramValue = searchParams.get(key);
    if (paramValue !== null) return paramValue;
    return initialValue;
  };

  const [value, setValue] = useState(getInitialState);

  // Sync state changes to URL
  const updateUrl = useCallback(
    (newValue) => {
      const params = new URLSearchParams(searchParams);

      if (newValue && newValue !== initialValue) {
        params.set(key, newValue);
      } else {
        params.delete(key);
      }

      // Use replace to avoid polluting history stack with every keystroke
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [key, initialValue, pathname, router, searchParams],
  );

  // Sync internal state when URL changes (e.g. back button)
  useEffect(() => {
    const paramValue = searchParams.get(key);
    const timer = setTimeout(() => {
      if (paramValue !== null && paramValue !== value) {
        setValue(paramValue);
      } else if (paramValue === null && value !== initialValue) {
        // Only reset if it was previously set, avoiding loops
        // setValue(initialValue); // This can be tricky with replaceState.
        // For now, let's trust the internal state unless URL explicitly overrides.
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams, key, value, initialValue]);

  // Wrapper to update both state and URL
  const setSyncedValue = (newValue) => {
    setValue(newValue);
    updateUrl(newValue);
  };

  return [value, setSyncedValue];
}
