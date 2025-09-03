import { useEffect, useLayoutEffect, useRef } from "react";

export function useOutsideClick<T extends Element>(
  cb: (e: Event) => void,
): React.MutableRefObject<T | null> {
  const ref = useRef<T>(null);
  const refCb = useRef(cb);

  useLayoutEffect(() => {
    refCb.current = cb;
  });

  useEffect(() => {
    const controller = new AbortController();

    const isIgnoredTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return false;
      }
      // Ignore clicks inside Radix portals/popovers (rendered outside of our container)
      const selectors = [
        "[data-radix-portal]",
        "[data-radix-popover-content-wrapper]",
        "[data-radix-popper-content-wrapper]",
      ];
      for (const sel of selectors) {
        if (target.closest(sel)) {
          return true;
        }
      }
      return false;
    };

    const handler = (e: MouseEvent | TouchEvent) => {
      const element = ref.current;
      const target = e.target as Node | null;
      if (!(element && target)) {
        return;
      }
      if (element.contains(target)) {
        return;
      }
      if (isIgnoredTarget(target)) {
        return;
      }
      refCb.current(e);
    };

    document.addEventListener("mousedown", handler, {
      signal: controller.signal,
    });
    document.addEventListener("touchstart", handler, {
      signal: controller.signal,
    });

    return () => controller.abort();
  }, []);

  return ref;
}
