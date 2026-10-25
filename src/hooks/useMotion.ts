import { useEffect, useRef, useState } from "react";

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      return;
    }
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

/** `shown` flips true once the element scrolls into view. Without IntersectionObserver (or with reduced motion) it starts true. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(() => typeof IntersectionObserver === "undefined" || prefersReducedMotion());
  useEffect(() => {
    if (shown || !ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.02 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [shown]);
  return { ref, shown };
}

/** Counts up to `target`, honouring reduced motion. */
export function useCountUp(target: number, durationMs = 900): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced || typeof requestAnimationFrame === "undefined") {
      setValue(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / durationMs);
      const v = Math.round(origin + (target - origin) * (1 - Math.pow(1 - k, 3)));
      setValue(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduced]);
  return value;
}

/** Pointer tilt: sets --rx / --ry on the element. No-op for touch pointers and reduced motion. */
export function useTilt<T extends HTMLElement>(max = 4) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    try {
      if (window.matchMedia("(pointer: coarse)").matches) return;
    } catch {
      return;
    }
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [max]);
  return ref;
}
