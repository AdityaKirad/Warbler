import { useEffect, useState } from "react";

export function useDeboucedValue<T>(value: T) {
  const [debounced, debouncedSet] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      debouncedSet(value);
    }, 300);

    return () => clearTimeout(timeout);
  }, [value]);

  return debounced;
}
