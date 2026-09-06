import { useEffect, useState } from "react";

/** Unix seconds, re-rendered every `intervalMs`. Used for cooldown
 * countdowns and "N days left" so they move without a page refresh. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now() / 1000), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
