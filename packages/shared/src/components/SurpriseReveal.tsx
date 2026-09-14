"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Gift, Mail, RotateCcw } from "lucide-react";
import type { RevealScene } from "./surprise-reveal-scene";
import styles from "./SurpriseReveal.module.css";

interface RevealProps {
  kind: "gift" | "envelope";
  children: ReactNode;
  label: string;
  skipLabel: string;
}

function SurpriseReveal({ kind, children, label, skipLabel }: RevealProps) {
  const [opened, setOpened] = useState(false);
  const [instant, setInstant] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduce, setReduce] = useState(true);
  const hostRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RevealScene | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "150px" });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !visible || reduce) return;
    let cancelled = false;
    let scene: RevealScene | null = null;
    void import("./surprise-reveal-scene").then(({ createRevealScene }) => {
      if (cancelled) return;
      try {
        scene = createRevealScene(host, kind, () => setReady(false));
        sceneRef.current = scene;
        scene.setOpen(host.dataset.open === "true", true);
        setReady(true);
      } catch {
        setReady(false);
      }
    }).catch(() => { if (!cancelled) setReady(false); });
    return () => {
      cancelled = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [kind, visible, reduce]);

  useEffect(() => {
    sceneRef.current?.setOpen(opened, instant || reduce);
    if (opened) contentRef.current?.focus({ preventScroll: true });
  }, [opened, instant, reduce]);

  const open = (skip: boolean) => {
    setInstant(skip);
    setOpened(true);
  };
  const Icon = kind === "gift" ? Gift : Mail;
  const enhanced = ready && visible && !reduce;
  return (
    <div ref={rootRef} className={styles.reveal} data-kind={kind} data-open={opened} data-instant={instant || reduce}>
      <div className={styles.stage}>
        <div className={styles.fallback} data-hidden={enhanced} aria-hidden="true">
          <Icon size={100} strokeWidth={1.2} />
        </div>
        <div ref={hostRef} data-open={opened} data-ready={enhanced} className={styles.canvas} aria-hidden="true" />
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.openButton} aria-expanded={opened} aria-controls={contentId}
          onClick={() => { if (opened) { setInstant(false); setOpened(false); } else open(false); }}>
          {opened ? <RotateCcw size={18} aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}
          {opened ? "Close and replay" : label}
        </button>
        {!opened && <button type="button" className={styles.skip} onClick={() => open(true)}>{skipLabel}<ArrowRight size={16} aria-hidden="true" /></button>}
      </div>
      <div id={contentId} ref={contentRef} tabIndex={-1} hidden={!opened} className={styles.content}>
        {opened && children}
      </div>
    </div>
  );
}

export function EnvelopeLetter({ children }: { children: ReactNode }) {
  return <SurpriseReveal kind="envelope" label="Open your letter" skipLabel="Read without animation">{children}</SurpriseReveal>;
}

export function GiftUnboxing({ recipientName, photo, demo = false }: { recipientName: string; photo?: string; demo?: boolean }) {
  return (
    <SurpriseReveal kind="gift" label={demo ? "Open a sample surprise" : "Unwrap your gift"} skipLabel="Skip animation">
      <div className={styles.giftResult}>
        {photo && <img src={photo} alt={demo ? "Sample celebration photo" : `A memory for ${recipientName}`} className={styles.memory} />}
        <div>
          <p className={styles.eyebrow}>{demo ? "Just4You / Sample celebration" : "A little something, just for you"}</p>
          <h3 className={styles.name}>{recipientName}</h3>
          <p className={styles.note}>{demo ? "Your photos. Your words. A website full of memories." : "Your memories and personal letter are waiting below."}</p>
          {demo && <a href="/demo/floral" className={styles.demoLink}>Explore this celebration <ArrowRight size={17} aria-hidden="true" /></a>}
        </div>
      </div>
    </SurpriseReveal>
  );
}

export function RecipientGift({ recipientName, photo }: { recipientName: string; photo?: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <details className={styles.recipient} onToggle={(event) => setExpanded(event.currentTarget.open)}>
      <summary><Gift size={18} aria-hidden="true" />Open your gift</summary>
      {expanded && <GiftUnboxing recipientName={recipientName} photo={photo} />}
    </details>
  );
}