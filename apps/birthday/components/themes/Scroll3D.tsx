"use client";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

/**
 * Shared 3D scroll primitives used across all celebration themes.
 * Each wrapper is style-agnostic — it only adds GPU-accelerated transforms
 * (transform / opacity) driven by the element's position in the viewport.
 * All effects respect the user's `prefers-reduced-motion` setting.
 */

type Common = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const SPRING = { stiffness: 120, damping: 28, restDelta: 0.001 };

/**
 * Tilt3D — rotates its contents through 3D space as the card scrolls
 * through the viewport, with a gentle parallax drift and scale swell.
 * `direction` (1 | -1) flips the tilt so alternating cards mirror each other.
 */
export function Tilt3D({
  children,
  className = "",
  style = {},
  direction = 1,
  intensity = 1,
}: Common & { direction?: number; intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotateY = useSpring(
    useTransform(scrollYProgress, [0, 0.5, 1], [16 * direction * intensity, 0, -16 * direction * intensity]),
    SPRING
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.5, 1], [11 * intensity, 0, -9 * intensity]),
    SPRING
  );
  const scale = useSpring(
    useTransform(scrollYProgress, [0, 0.5, 1], [0.88, 1, 0.92]),
    SPRING
  );
  const y = useSpring(
    useTransform(scrollYProgress, [0, 1], [56 * intensity, -56 * intensity]),
    SPRING
  );

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={{ perspective: 1100, ...style }}>
      <motion.div
        style={{
          rotateX,
          rotateY,
          scale,
          y,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Parallax — subtle vertical drift tied to scroll, giving text and
 * captions a sense of depth relative to the imagery beside them.
 */
export function Parallax({
  children,
  className = "",
  style = {},
  distance = 60,
}: Common & { distance?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useSpring(
    useTransform(scrollYProgress, [0, 1], [distance, -distance]),
    SPRING
  );

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={style}>
      <motion.div style={{ y, willChange: "transform" }}>{children}</motion.div>
    </div>
  );
}

/**
 * Reveal3D — one-time 3D flip-up entrance when the element scrolls into
 * view. Ideal for grids of small cards that should pop with depth.
 */
export function Reveal3D({
  children,
  className = "",
  style = {},
  index = 0,
  originX = "center",
}: Common & { index?: number; originX?: "left" | "center" | "right" }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        className={className}
        style={{ transformStyle: "preserve-3d", transformOrigin: `${originX} bottom`, ...style }}
        initial={{ opacity: 0, rotateX: 32, y: 40, scale: 0.94 }}
        whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{
          duration: 0.7,
          delay: (index % 6) * 0.08,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Hero3D — the showpiece opener. Content flips in through 3D space on mount,
 * then continuously responds to pointer movement with a live 3D tilt, giving
 * the hero a tactile, holographic feel. Falls back to a plain container when
 * reduced motion is requested.
 */
export function Hero3D({
  children,
  className = "",
  style = {},
  intensity = 1,
}: Common & { intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 150, damping: 18, restDelta: 0.001 });
  const rotateY = useSpring(tiltY, { stiffness: 150, damping: 18, restDelta: 0.001 });

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    tiltY.set(px * 20 * intensity);
    tiltX.set(-py * 20 * intensity);
  };
  const reset = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointer}
      onPointerLeave={reset}
      className={className}
      style={{ perspective: 1000, ...style }}
    >
      <motion.div
        initial={{ opacity: 0, rotateX: -38, y: 70, scale: 0.88 }}
        animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d", willChange: "transform" }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
