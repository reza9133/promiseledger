import type { ReactNode } from "react";
import { useReveal } from "../hooks/useMotion";

export function Reveal({
  children,
  as: Tag = "div",
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  as?: "div" | "section" | "li";
  className?: string;
  delay?: number;
}) {
  const { ref, shown } = useReveal<HTMLElement>();
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${shown ? "is-in" : ""} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
