"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarPlus,
  Check,
  Drum,
  Heart,
  MapPin,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import styles from "./WeddingInvitation.module.css";

type CeremonyInteraction = "scratch" | "trace" | "rhythm" | "reveal";

export interface WeddingCeremony {
  id: string;
  name: string;
  subtitle: string;
  date: string;
  time: string;
  venue: string;
  dressCode: string;
  note: string;
  image: string;
  revealMusicUrl?: string;
  interaction: CeremonyInteraction;
}

export interface WeddingInvitationData {
  couple: {
    partnerOne: string;
    partnerTwo: string;
    monogram: string;
  };
  families: string;
  date: string;
  location: string;
  hashtag: string;
  heroImage?: string;
  directionsUrl: string;
  whatsappNumber: string;
  rsvpEnabled?: boolean;
  ceremonies: WeddingCeremony[];
}

interface WeddingInvitationProps {
  invitation: WeddingInvitationData;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const PETALS = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  left: (index * 37 + 11) % 100,
  delay: (index * 0.83) % 9,
  duration: 9 + (index % 6) * 1.2,
  color: ["#8f2341", "#d59a25", "#e8b0a9", "#315a46"][index % 4],
}));

function calculateTimeLeft(date: string): TimeLeft {
  const difference = Math.max(0, new Date(date).getTime() - Date.now());
  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1_000) % 60),
  };
}

function formatCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function downloadCalendar(ceremony: WeddingCeremony, coupleNames: string): void {
  const startsAt = new Date(ceremony.date);
  const endsAt = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000);
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Just4You//Wedding Invitation//EN",
    "BEGIN:VEVENT",
    `UID:${ceremony.id}-${startsAt.getTime()}@just4you.buzz`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    `DTSTART:${formatCalendarDate(startsAt)}`,
    `DTEND:${formatCalendarDate(endsAt)}`,
    `SUMMARY:${ceremony.name} - ${coupleNames}`,
    `DESCRIPTION:${ceremony.subtitle}`,
    `LOCATION:${ceremony.venue}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${ceremony.id}-${coupleNames.toLowerCase().replaceAll(" ", "-")}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function FallingPetals() {
  return (
    <div className={styles.petals} aria-hidden="true">
      {PETALS.map((petal) => (
        <span
          key={petal.id}
          style={{
            left: `${petal.left}%`,
            animationDelay: `${petal.delay}s`,
            animationDuration: `${petal.duration}s`,
            background: petal.color,
          }}
        />
      ))}
    </div>
  );
}

function SectionHeading({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <motion.header
      className={styles.sectionHeading}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
    >
      <p>{eyebrow}</p>
      <h2>{children}</h2>
    </motion.header>
  );
}

function ScratchReveal({ ceremony }: { ceremony: WeddingCeremony }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const strokesRef = useRef(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const drawCover = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.fillStyle = "#d59a25";
      context.fillRect(0, 0, rect.width, rect.height);
      context.fillStyle = "rgba(255, 245, 210, 0.18)";
      for (let y = 22; y < rect.height; y += 36) {
        for (let x = 22; x < rect.width; x += 36) {
          context.beginPath();
          context.arc(x, y, 3, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.fillStyle = "#fff4ce";
      context.textAlign = "center";
      context.font = `700 13px ${getComputedStyle(document.body).fontFamily}`;
      context.fillText("RUB OFF THE TURMERIC", rect.width / 2, rect.height / 2);
    };
    drawCover();
    const observer = new ResizeObserver(drawCover);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const erase = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || complete) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(
      (event.clientX - rect.left) * scaleX,
      (event.clientY - rect.top) * scaleY,
      Math.max(30, rect.width * 0.085) * scaleX,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.restore();
    strokesRef.current += 1;
    if (strokesRef.current >= 38) setComplete(true);
  };

  return (
    <div className={styles.ritualSurface}>
      <Image src={ceremony.image} alt="Haldi celebration table" fill sizes="(max-width: 720px) 92vw, 560px" />
      <div className={styles.ritualCaption}>
        <span>Sunlit beginnings</span>
        <strong>{ceremony.name}</strong>
        <small>{complete ? "Revealed with love" : "Rub across the card"}</small>
      </div>
      <canvas
        ref={canvasRef}
        className={`${styles.scratchCanvas} ${complete ? styles.finished : ""}`}
        onPointerDown={(event) => {
          drawingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          erase(event);
        }}
        onPointerMove={erase}
        onPointerUp={() => {
          drawingRef.current = false;
        }}
        onPointerCancel={() => {
          drawingRef.current = false;
        }}
        aria-label="Rub the turmeric away to reveal the Haldi invitation"
      />
    </div>
  );
}

function TraceReveal({ ceremony }: { ceremony: WeddingCeremony }) {
  const drawingRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const complete = progress >= 1;

  const trace = () => {
    if (!drawingRef.current || complete) return;
    setProgress((current) => Math.min(1, current + 0.026));
  };

  return (
    <div
      className={styles.ritualSurface}
      onPointerDown={(event) => {
        drawingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        trace();
      }}
      onPointerMove={trace}
      onPointerUp={() => {
        drawingRef.current = false;
      }}
      onPointerCancel={() => {
        drawingRef.current = false;
      }}
    >
      <Image src={ceremony.image} alt="Wedding rings for the Mehndi ceremony" fill sizes="(max-width: 720px) 92vw, 560px" />
      <div className={`${styles.traceLayer} ${complete ? styles.finished : ""}`}>
        <svg viewBox="0 0 220 200" role="img" aria-label="Trace the heart to reveal the Mehndi invitation">
          <path className={styles.heartGuide} d="M110 174C91 151 35 118 35 72C35 42 72 28 96 48L110 62L124 48C148 28 185 42 185 72C185 118 129 151 110 174Z" />
          <path
            className={styles.heartTrace}
            pathLength="1"
            style={{ strokeDashoffset: 1 - progress }}
            d="M110 174C91 151 35 118 35 72C35 42 72 28 96 48L110 62L124 48C148 28 185 42 185 72C185 118 129 151 110 174Z"
          />
        </svg>
        <p>{complete ? "A promise traced" : "Trace the heart with henna"}</p>
      </div>
      <div className={styles.ritualCaption}>
        <span>Patterns of promise</span>
        <strong>{ceremony.name}</strong>
        <small>{complete ? "The heart is complete" : "Keep tracing"}</small>
      </div>
    </div>
  );
}

function playDrumBeat(): void {
  const AudioContextClass = window.AudioContext;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(150, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(58, context.currentTime + 0.14);
  gain.gain.setValueAtTime(0.42, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.17);
  oscillator.addEventListener("ended", () => void context.close());
}

function RhythmReveal({ ceremony }: { ceremony: WeddingCeremony }) {
  const [beats, setBeats] = useState(0);
  const complete = beats >= 5;

  return (
    <div className={styles.rhythmSurface}>
      <Image src={ceremony.image} alt="Sangeet dance floor" fill sizes="(max-width: 720px) 92vw, 560px" />
      <div className={styles.rhythmTint} />
      <div className={styles.rhythmContent}>
        <button
          type="button"
          className={styles.dholButton}
          onClick={() => {
            playDrumBeat();
            setBeats((current) => Math.min(5, current + 1));
          }}
          aria-label="Tap the dhol"
        >
          <Drum size={64} strokeWidth={1.25} />
        </button>
        <strong>{complete ? "The celebration is in rhythm" : "Tap the dhol"}</strong>
        <div className={styles.beatDots} aria-label={`${beats} of 5 beats`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < beats ? styles.beatActive : ""} />
          ))}
        </div>
        <small>{complete ? ceremony.note : "Five beats to reveal the celebration"}</small>
      </div>
    </div>
  );
}

function SimpleReveal({ ceremony }: { ceremony: WeddingCeremony }) {
  const captions: Record<string, { eyebrow: string; imageAlt: string }> = {
    bonalu: { eyebrow: "Blessings of Ammavaru", imageAlt: "Bonalu celebration" },
    reception: { eyebrow: "Dinner and dancing", imageAlt: "Wedding reception" },
    wedding: { eyebrow: "The sacred vows", imageAlt: "Wedding couple" },
  };
  const caption = captions[ceremony.id] ?? { eyebrow: ceremony.subtitle, imageAlt: ceremony.name };
  return (
    <div className={styles.ritualSurface}>
      <Image src={ceremony.image} alt={caption.imageAlt} fill sizes="(max-width: 720px) 92vw, 560px" />
      <div className={styles.ritualCaption}>
        <span>{caption.eyebrow}</span>
        <strong>{ceremony.name}</strong>
        <small>{ceremony.note}</small>
      </div>
    </div>
  );
}

function defaultCeremonyMusic(ceremonyId: string): string {
  const tracks: Record<string, string> = {
    haldi: "/music/t3.mp3",
    mehndi: "/music/t7.mp3",
    sangeet: "/music/t3.mp3",
    bonalu: "/music/t8.mp3",
    wedding: "/music/t8.mp3",
    reception: "/music/t6.mp3",
  };
  return tracks[ceremonyId] ?? "/music/t2.mp3";
}

function CeremonyModal({ ceremony, onClose }: { ceremony: WeddingCeremony; onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const revealMusic = new Audio(ceremony.revealMusicUrl || defaultCeremonyMusic(ceremony.id));
    revealMusic.volume = 0.75;
    void revealMusic.play().catch(() => {
      // Browser autoplay policy may require the guest to interact again.
    });
    return () => {
      document.body.style.overflow = previousOverflow;
      revealMusic.pause();
    };
  }, [ceremony.id, ceremony.revealMusicUrl]);

  return (
    <motion.div
      className={styles.modalBackdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${ceremony.name} interactive invitation`}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.35 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close invitation">
          <X size={19} />
        </button>
        {ceremony.interaction === "scratch" && <ScratchReveal ceremony={ceremony} />}
        {ceremony.interaction === "trace" && <TraceReveal ceremony={ceremony} />}
        {ceremony.interaction === "rhythm" && <RhythmReveal ceremony={ceremony} />}
        {ceremony.interaction === "reveal" && <SimpleReveal ceremony={ceremony} />}
      </motion.div>
    </motion.div>
  );
}

export default function WeddingInvitation({ invitation }: WeddingInvitationProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [openingComplete, setOpeningComplete] = useState(false);
  const [activeCeremony, setActiveCeremony] = useState<WeddingCeremony | null>(null);
  const [team, setTeam] = useState<"bride" | "groom" | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [selectedCeremonies, setSelectedCeremonies] = useState<string[]>(
    invitation.ceremonies.map((ceremony) => ceremony.id),
  );
  const reduceMotion = useReducedMotion();
  const coupleNames = `${invitation.couple.partnerOne} & ${invitation.couple.partnerTwo}`;
  const hasHeroImage = Boolean(invitation.heroImage?.trim());
  const weddingDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(invitation.date));

  useEffect(() => {
    if (!openingComplete) return;
    const update = () => setTimeLeft(calculateTimeLeft(invitation.date));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [invitation.date, openingComplete]);

  useEffect(() => {
    if (!isOpening) return;
    const timer = window.setTimeout(() => setOpeningComplete(true), 4_650);
    return () => window.clearTimeout(timer);
  }, [isOpening]);

  const sendRsvp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "Guest");
    const guests = String(form.get("guests") || "1");
    const events = invitation.ceremonies
      .filter((ceremony) => selectedCeremonies.includes(ceremony.id))
      .map((ceremony) => ceremony.name)
      .join(", ");
    const message = attending === "yes"
      ? `Hello! ${name} will joyfully attend ${coupleNames}'s wedding. Events: ${events}. Guests: ${guests}.`
      : `Hello! ${name} regretfully cannot attend ${coupleNames}'s wedding.`;
    window.open(`https://wa.me/${invitation.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className={styles.page}>
      <FallingPetals />

      <section
        className={styles.hero}
        aria-label={hasHeroImage ? `${coupleNames} wedding invitation` : undefined}
        aria-labelledby={hasHeroImage ? undefined : "wedding-title"}
      >
        {hasHeroImage && invitation.heroImage ? (
          <Image className={styles.heroImage} src={invitation.heroImage} alt={`${coupleNames} wedding invitation`} fill priority sizes="100vw" />
        ) : (
          <>
            <div className={styles.heroShade} />
            <div className={styles.heroTexture} />
            <motion.div
              className={styles.heroContent}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35 }}
            >
              <p className={styles.eyebrow}>{invitation.families}</p>
              <p className={styles.invitationLine}>request the pleasure of your company</p>
              <h1 id="wedding-title" className={styles.names}>
                <span>{invitation.couple.partnerOne}</span>
                <b>&amp;</b>
                <span>{invitation.couple.partnerTwo}</span>
              </h1>
              <div className={styles.details}>
                <span>{weddingDate}</span>
                <i aria-hidden="true" />
                <span>{invitation.location}</span>
              </div>
              <p className={styles.hashtag}>{invitation.hashtag}</p>
            </motion.div>
          </>
        )}
      </section>

      <section id="celebrations" className={styles.festivities}>
        <SectionHeading eyebrow="Four days of celebration">The Festivities</SectionHeading>
        <div className={styles.timeline}>
          {invitation.ceremonies.map((ceremony, index) => (
            <motion.article
              key={ceremony.id}
              className={styles.ceremony}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-70px" }}
              transition={{ duration: 0.65, delay: index * 0.06 }}
            >
              <div className={styles.timelineMarker}><span>{index + 1}</span></div>
              <div className={styles.ceremonyCopy}>
                <p>{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date(ceremony.date))}</p>
                <h3>{ceremony.name}</h3>
                <strong>{ceremony.subtitle}</strong>
                <dl>
                  <div><dt>When</dt><dd>{ceremony.time}</dd></div>
                  <div><dt>Where</dt><dd>{ceremony.venue}</dd></div>
                  <div><dt>Wear</dt><dd>{ceremony.dressCode}</dd></div>
                </dl>
                <blockquote>{ceremony.note}</blockquote>
                <button type="button" className={styles.outlineButton} onClick={() => downloadCalendar(ceremony, coupleNames)}>
                  <CalendarPlus size={16} /> Add to calendar
                </button>
              </div>
              <button type="button" className={styles.revealCard} onClick={() => setActiveCeremony(ceremony)} aria-label={`Open the ${ceremony.name} invitation`}>
                <Image src={ceremony.image} alt="" fill sizes="128px" />
                <span><Sparkles size={14} /> Reveal</span>
              </button>
            </motion.article>
          ))}
        </div>
      </section>

      <section className={styles.teamSection}>
        <SectionHeading eyebrow="A little friendly rivalry">Pick your side</SectionHeading>
        <p className={styles.sectionIntro}>Whose side are you cheering for? Your pick travels with your RSVP.</p>
        <div className={styles.teamPicker}>
          <button type="button" className={team === "bride" ? styles.teamSelected : ""} onClick={() => setTeam("bride")}>
            <Heart size={24} />
            <small>Team Bride</small>
            <strong>{invitation.couple.partnerOne}</strong>
            {team === "bride" && <span><Check size={13} /> You&apos;re in</span>}
          </button>
          <i>or</i>
          <button type="button" className={team === "groom" ? styles.teamSelected : ""} onClick={() => setTeam("groom")}>
            <Sparkles size={24} />
            <small>Team Groom</small>
            <strong>{invitation.couple.partnerTwo}</strong>
            {team === "groom" && <span><Check size={13} /> You&apos;re in</span>}
          </button>
        </div>
      </section>

      <section className={styles.countdownSection}>
        <p>Counting down to the muhurtham</p>
        <div className={styles.countdown}>
          {Object.entries(timeLeft).map(([label, value]) => (
            <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>
          ))}
        </div>
      </section>

      {invitation.rsvpEnabled !== false && <section className={styles.rsvpSection}>
        <div className={styles.rsvpIntro}>
          <p>Save your place</p>
          <h2>Will you join us?</h2>
          <span>Kindly reply before 15 November 2026.</span>
          <div className={styles.locationActions}>
            <button type="button" onClick={() => downloadCalendar(invitation.ceremonies.at(-1)!, coupleNames)}>
              <CalendarPlus size={17} /> Add wedding
            </button>
            <a href={invitation.directionsUrl} target="_blank" rel="noreferrer">
              <MapPin size={17} /> Directions
            </a>
          </div>
        </div>
        <form className={styles.rsvpForm} onSubmit={sendRsvp}>
          <label>
            Your name
            <input name="name" type="text" placeholder="e.g. Lakshmi Iyer" required />
          </label>
          <fieldset>
            <legend>Will you attend?</legend>
            <div className={styles.segmented}>
              <button type="button" className={attending === "yes" ? styles.segmentActive : ""} onClick={() => setAttending("yes")}>Joyfully yes</button>
              <button type="button" className={attending === "no" ? styles.segmentActive : ""} onClick={() => setAttending("no")}>Regretfully no</button>
            </div>
          </fieldset>
          {attending === "yes" && (
            <>
              <fieldset>
                <legend>Which celebrations?</legend>
                <div className={styles.occasionOptions}>
                  {invitation.ceremonies.map((ceremony) => {
                    const selected = selectedCeremonies.includes(ceremony.id);
                    return (
                      <button
                        key={ceremony.id}
                        type="button"
                        className={selected ? styles.occasionSelected : ""}
                        onClick={() => setSelectedCeremonies((current) => selected ? current.filter((id) => id !== ceremony.id) : [...current, ceremony.id])}
                      >
                        {ceremony.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <label>
                Number of guests
                <input name="guests" type="number" min="1" max="10" defaultValue="1" required />
              </label>
            </>
          )}
          <button className={styles.whatsappButton} type="submit">
            <MessageCircle size={18} /> Send RSVP on WhatsApp
          </button>
        </form>
      </section>}

      <footer className={styles.finale}>
        <span>ॐ</span>
        <p>With the blessings of our elders<br />and the warmth of your presence.</p>
        <strong>{coupleNames}</strong>
        <small>Made with love</small>
      </footer>

      <AnimatePresence>
        {activeCeremony && <CeremonyModal ceremony={activeCeremony} onClose={() => setActiveCeremony(null)} />}
      </AnimatePresence>

      {!openingComplete && (
        <section className={`${styles.opener} ${isOpening ? styles.opening : ""}`} data-wedding-opener aria-label="Open the wedding invitation">
          <div className={`${styles.door} ${styles.doorLeft}`} />
          <div className={`${styles.door} ${styles.doorRight}`} />
          <div className={styles.sealWrap}>
            <button
              ref={(button) => {
                if (!button) return;
                const openInvitation = () => setIsOpening(true);
                button.onpointerdown = openInvitation;
                button.onclick = openInvitation;
              }}
              className={styles.seal}
              type="button"
            >
              <span>{invitation.couple.monogram}</span>
              <small>Tap to open</small>
            </button>
          </div>
        </section>
      )}
    </main>
  );
}