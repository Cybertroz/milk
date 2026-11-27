import React, { useEffect, useState } from 'react';

interface RipplePoint {
  id: number;
  x: number;
  y: number;
}

/**
 * Adds dynamic interactive milk cream ripples whenever the user clicks in the hero area.
 */
export function MilkClickRipple() {
  const [ripples, setRipples] = useState<RipplePoint[]>([]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const heroSection = target.closest('section');
      if (!heroSection) return;

      const rect = heroSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const id = Date.now();
      setRipples((prev) => [...prev.slice(-6), { id, x, y }]);

      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 1200);
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none print-hide absolute inset-0 overflow-hidden z-[12]"
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full border-2 border-white bg-white/30 animate-click-milk-ripple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: '24px',
            height: '24px',
            marginLeft: '-12px',
            marginTop: '-12px',
          }}
        />
      ))}
    </div>
  );
}
