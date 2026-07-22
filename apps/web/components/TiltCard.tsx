"use client";

import { useEffect, useRef, ReactNode, CSSProperties } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  animate,
  useReducedMotion,
} from "framer-motion";

/**
 * TiltCard — a 3D perspective tilt wrapper that follows the pointer, with an
 * optional light "glare" sweep. Respects prefers-reduced-motion (falls back to
 * a flat, static card). Content can be lifted toward the viewer by giving child
 * elements `style={{ transform: "translateZ(Npx)" }}`.
 */
export function TiltCard({
  children,
  className,
  style,
  max = 9,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 24 });

  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), {
    stiffness: 220,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), {
    stiffness: 220,
    damping: 18,
  });

  const glareX = useTransform(px, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(py, [-0.5, 0.5], ["0%", "100%"]);
  const glareBg = useTransform(
    [glareX, glareY],
    ([gx, gy]) =>
      `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.22), transparent 50%)`
  );

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleEnter() {
    if (!reduce) glareOpacity.set(1);
  }

  function reset() {
    px.set(0);
    py.set(0);
    glareOpacity.set(0);
  }

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={reset}
      className={className}
      style={{
        ...style,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 900,
      }}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            mixBlendMode: "soft-light",
            opacity: glareOpacity,
            background: glareBg,
          }}
        />
      )}
    </motion.div>
  );
}

/**
 * AnimatedCounter — counts up from 0 to `value` once it scrolls into view.
 */
export function AnimatedCounter({
  value,
  className,
  style,
}: {
  value: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    if (inView) {
      const controls = animate(mv, value, {
        duration: 1.1,
        ease: [0.22, 1, 0.36, 1],
      });
      return () => controls.stop();
    }
  }, [inView, value, reduce, mv]);

  return (
    <motion.span ref={ref} className={className} style={style}>
      {rounded}
    </motion.span>
  );
}
