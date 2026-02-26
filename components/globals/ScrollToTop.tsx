"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const ScrollToTop = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleScroll = (event?: Event) => {
      const target = event?.target as HTMLElement | null;
      if (!target || typeof target.scrollTop !== "number") return;
      if (target.scrollHeight > target.clientHeight) {
        scrollContainerRef.current = target;
      }
    };

    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, []);

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    const target =
      scrollContainerRef.current ||
      document.scrollingElement ||
      document.documentElement ||
      document.body;

    const start = typeof target?.scrollTop === "number" ? target.scrollTop : window.scrollY;
    const duration = 420;
    const startTime = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const value = Math.max(0, start * (1 - easeOutCubic(t)));

      if (target && "scrollTop" in target) {
        (target as HTMLElement).scrollTop = value;
      } else {
        window.scrollTo(0, value);
      }

      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    requestAnimationFrame(scrollToTop);
    setTimeout(scrollToTop, 120);
  }, [pathname, searchParams.toString()]);

  return null;
};

export default ScrollToTop;
