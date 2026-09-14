"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { AlbumScene } from "./memory-album-scene";
import styles from "./MemoryAlbum.module.css";

export interface MemoryPhoto {
  url: string;
  caption: string;
}

interface MemoryAlbumProps {
  photos: MemoryPhoto[];
  theme?: "galaxy" | "floral" | "neon" | "minimal" | "retro" | "magical";
}

const PALETTES = {
  galaxy: { accent: "#c4a5ed", ink: "#f5efff", muted: "#c1b2d4", cover: "#463460" },
  floral: { accent: "#a92562", ink: "#622440", muted: "#805269", cover: "#9c3e65" },
  neon: { accent: "#65e6d5", ink: "#e4fffc", muted: "#91bcb7", cover: "#17675f" },
  minimal: { accent: "#343b40", ink: "#24292e", muted: "#60676d", cover: "#515b61" },
  retro: { accent: "#e4bf81", ink: "#f5e4c6", muted: "#c9aa83", cover: "#715031" },
  magical: { accent: "#c42f68", ink: "#66324b", muted: "#77536a", cover: "#bb4671" },
};

function PhotoFallback({ photo, number }: { photo: MemoryPhoto; number: number }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={styles.missing} role="img" aria-label={`Memory ${number}: photo unavailable`}>
      <ImageOff size={32} aria-hidden="true" />
      <span>Photo unavailable</span>
    </div>
  ) : (
    <img src={photo.url} alt={`Memory ${number}: ${photo.caption}`} draggable={false}
      onError={() => setFailed(true)} className={styles.photo} />
  );
}

export default function MemoryAlbum({ photos, theme = "minimal" }: MemoryAlbumProps) {
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<AlbumScene | null>(null);
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const captionId = useId();
  const activeIndex = Math.min(index, Math.max(0, photos.length - 1));
  const activePhoto = photos[activeIndex];
  const palette = PALETTES[theme];
  const sources = JSON.stringify(photos.map((photo) => photo.url));

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      setNearby(entry.isIntersecting);
    }, { rootMargin: "200px" });
    observer.observe(root);
    return () => observer.disconnect();
  }, [photos.length]);

  useEffect(() => {
    const host = canvasRef.current;
    if (!host || !nearby || reducedMotion || !photos.length) return;
    let cancelled = false;
    let album: AlbumScene | null = null;
    void import("./memory-album-scene").then(({ createAlbumScene }) => {
      if (cancelled) return;
      try {
        album = createAlbumScene(host, JSON.parse(sources) as string[], palette.cover, setReady);
        sceneRef.current = album;
        album.show(Number(host.dataset.index ?? 0));
      } catch {
        setReady(false);
      }
    }).catch(() => setReady(false));
    return () => {
      cancelled = true;
      album?.dispose();
      sceneRef.current = null;
    };
  }, [nearby, reducedMotion, sources, palette.cover, photos.length]);

  useEffect(() => {
    sceneRef.current?.show(activeIndex);
  }, [activeIndex]);

  const goTo = (next: number) => setIndex(Math.max(0, Math.min(photos.length - 1, next)));
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== event.pointerId) return;
    const distanceX = event.clientX - start.x;
    const distanceY = event.clientY - start.y;
    if (Math.abs(distanceX) > 45 && Math.abs(distanceX) > Math.abs(distanceY) * 1.3) {
      goTo(activeIndex + (distanceX < 0 ? 1 : -1));
    }
  };

  if (!activePhoto) return null;
  const enhanced = ready && nearby && !reducedMotion;
  return (
    <section ref={rootRef} className={styles.album} aria-label="Memory album"
      aria-roledescription="carousel" style={{
        "--album-accent": palette.accent, "--album-ink": palette.ink,
        "--album-muted": palette.muted, "--album-cover": palette.cover,
      } as CSSProperties}>
      <div className={styles.stage} tabIndex={0} role="group" aria-label="Album photos"
        aria-describedby={captionId} onPointerDown={pointerDown} onPointerUp={pointerUp}
        onPointerCancel={() => { gesture.current = null; }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft" || event.key === "Home" || event.key === "End") {
            event.preventDefault();
            goTo(event.key === "Home" ? 0 : event.key === "End" ? photos.length - 1 : activeIndex + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}>
        <div className={styles.fallback} data-hidden={enhanced}>
          <div className={styles.fallbackPage}>
            <PhotoFallback key={`${activeIndex}-${activePhoto.url}`} photo={activePhoto} number={activeIndex + 1} />
          </div>
        </div>
        <div ref={canvasRef} data-index={activeIndex} className={styles.canvas}
          data-ready={enhanced} aria-hidden="true" />
      </div>
      <div className={styles.captionArea}>
        <p className={styles.position} aria-live="polite" aria-atomic="true">Memory {activeIndex + 1} of {photos.length}</p>
        <p id={captionId} className={styles.caption}>{activePhoto.caption}</p>
      </div>
      {photos.length > 1 && (
        <div className={styles.navigation}>
          <button type="button" className={styles.arrow} onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0} aria-label="Previous memory" title="Previous memory">
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <div className={styles.thumbnails} aria-label="Choose a memory">
            {photos.map((photo, photoIndex) => (
              <button type="button" key={`${photoIndex}-${photo.url}`} className={styles.thumbnail}
                aria-label={`Show memory ${photoIndex + 1}`} aria-pressed={activeIndex === photoIndex}
                title={`Memory ${photoIndex + 1}`} onClick={() => goTo(photoIndex)}>
                <img src={photo.url} alt="" loading="lazy" draggable={false} />
              </button>
            ))}
          </div>
          <button type="button" className={styles.arrow} onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === photos.length - 1} aria-label="Next memory" title="Next memory">
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}