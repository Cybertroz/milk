import React, { useCallback, useEffect, useRef } from 'react';
import { computeCardTilt } from '../utils/cardTilt';

interface TiltProductCardProps {
  children: React.ReactNode;
  className?: string;
  outerClassName?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
  'data-reveal'?: 'up';
  maxDeg?: number;
}

/**
 * Interactive 3D hover tilt surface powered by compositor-only CSS transforms
 * and custom CSS variables updated on pointer move without React re-renders.
 */
export function TiltProductCard({
  children,
  className = '',
  outerClassName = '',
  style,
  'data-testid': dataTestId,
  'data-reveal': dataReveal,
  maxDeg = 5.5,
}: TiltProductCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const applyTilt = useCallback(
    (clientX: number, clientY: number) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const relX = (clientX - rect.left) / rect.width;
      const relY = (clientY - rect.top) / rect.height;
      const tilt = computeCardTilt(relX, relY, maxDeg);

      el.style.setProperty('--tilt-rx', `${tilt.rotateXDeg}deg`);
      el.style.setProperty('--tilt-ry', `${tilt.rotateYDeg}deg`);
      el.style.setProperty('--tilt-px', `${tilt.shiftX}px`);
      el.style.setProperty('--tilt-py', `${tilt.shiftY}px`);
      el.style.setProperty('--glare-x', `${tilt.glareX}%`);
      el.style.setProperty('--glare-y', `${tilt.glareY}%`);
      el.style.setProperty('--glare-o', '1');
    },
    [maxDeg]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'touch') return;
      const x = e.clientX;
      const y = e.clientY;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = window.requestAnimationFrame(() => {
        applyTilt(x, y);
      });
    },
    [applyTilt]
  );

  const handlePointerLeave = useCallback(() => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--tilt-rx', '0deg');
    el.style.setProperty('--tilt-ry', '0deg');
    el.style.setProperty('--tilt-px', '0px');
    el.style.setProperty('--tilt-py', '0px');
    el.style.setProperty('--glare-o', '0');
  }, []);

  return (
    <div
      data-reveal={dataReveal}
      style={style}
      className={`product-tilt-outer ${outerClassName}`}
    >
      <article
        ref={cardRef}
        data-testid={dataTestId}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        className={`product-tilt-card relative ${className}`}
      >
        {children}
        <div className="product-tilt-glare" aria-hidden="true" />
      </article>
    </div>
  );
}
