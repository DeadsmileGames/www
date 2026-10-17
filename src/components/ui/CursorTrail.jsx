import { useEffect, useRef } from "react";

const TRAIL_LENGTH = 8;

export function CursorTrail() {
  const trailRef = useRef(null);

  useEffect(() => {
    const container = trailRef.current;
    if (!container || window.matchMedia("(pointer: coarse)").matches) return undefined;

    const nodes = Array.from(container.querySelectorAll("[data-cursor-trail-item]"));
    const points = nodes.map(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let frame = 0;
    let started = false;

    function animate() {
      frame = 0;
      let unsettled = false;

      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        const target = index === 0 ? { x: targetX, y: targetY } : points[index - 1];
        const ease = index === 0 ? 0.78 : 0.32;
        const dx = target.x - point.x;
        const dy = target.y - point.y;

        point.x += dx * ease;
        point.y += dy * ease;
        if (Math.abs(dx) + Math.abs(dy) > 0.35) unsettled = true;

        nodes[index].style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
        nodes[index].style.opacity = String(Math.max(0.12, 0.76 - index * 0.085));
      }

      if (unsettled) frame = window.requestAnimationFrame(animate);
    }

    function onPointerMove(event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!started) {
        points.forEach((point) => {
          point.x = targetX;
          point.y = targetY;
        });
        started = true;
      }
      container.style.opacity = "1";
      if (!frame) frame = window.requestAnimationFrame(animate);
    }

    function onPointerLeave() {
      container.style.opacity = "0";
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="cursor-trail" ref={trailRef} aria-hidden="true">
      {Array.from({ length: TRAIL_LENGTH }, (_, index) => (
        <span className="cursor-trail__ghost" data-cursor-trail-item key={index}>
          <svg viewBox="0 0 22 28" focusable="false" aria-hidden="true">
            <path
              d="M2 1.5 2 22.5 7.2 17.1 12.1 26 16 23.9 11.3 15 19.4 14.4Z"
              fill="#ffff00"
              stroke="#000"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
