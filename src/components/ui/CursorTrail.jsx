import { useEffect } from "react";
import { ghostCursor } from "./ghostCursor";

export function CursorTrail() {
  useEffect(() => {
    const effect = ghostCursor();
    return () => effect.destroy();
  }, []);

  return null;
}
