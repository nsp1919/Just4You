"use client";
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion'
import "./landing.css"
import {
  Sparkles, ArrowRight, Play, Check, Star, ChevronLeft, ChevronRight,
  Quote, Music2, Images, Lock, Clock, MessageCircle, Gift, Zap, Shield, Share2,
  Menu, X, Heart, Camera, Mail, Globe2, Palette, Code2, Rocket
} from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────────────────────────── */

// This landing now lives inside the web app, so all internal links are
// same-origin relative paths (e.g. /pricing, /demo, /login, /register).
const appUrl = (path: string) => path;

const OCCASIONS = [
  { emoji: '🎂', title: 'Birthday Websites', tag: 'Most Popular', c: '#ff9e4f', bg: 'rgba(255,158,79,0.06)', border: 'rgba(255,158,79,0.16)',
    desc: 'A personalized birthday page packed with photos, music, countdown & a heartfelt surprise reveal.' },
  { emoji: '💍', title: 'Anniversary Websites', tag: 'Most Romantic', c: '#ff6f9c', bg: 'rgba(255,111,156,0.06)', border: 'rgba(255,111,156,0.16)',
    desc: 'Celebrate years of togetherness with a stunning timeline of shared memories & love letters.' },
  { emoji: '💌', title: 'Proposal Websites', tag: 'Trending', c: '#ff5f8f', bg: 'rgba(255,95,143,0.06)', border: 'rgba(255,95,143,0.16)',
    desc: 'Pop the question with a cinematic digital story — photos, vows & a Yes/No reveal moment.' },
  { emoji: '🧸', title: 'Kids Birthday', tag: 'Adorable', c: '#ffbe3d', bg: 'rgba(255,190,61,0.06)', border: 'rgba(255,190,61,0.16)',
    desc: 'Colorful, playful birthday pages with balloon animations, character themes & fun surprises.' },
  { emoji: '🎓', title: 'Graduation Websites', tag: 'New ✨', c: '#f7a83a', bg: 'rgba(247,168,58,0.06)', border: 'rgba(247,168,58,0.16)',
    desc: 'Honour the achievement with a premium tribute — professor wishes, milestone photos & a proud message.' },
  { emoji: '🎉', title: 'Custom Celebrations', tag: 'Fully Custom', c: '#ff7d6b', bg: 'rgba(255,125,107,0.06)', border: 'rgba(255,125,107,0.16)',
    desc: 'Weddings, engagements, reunions, farewells — any occasion crafted beautifully, just for you.' },
]

const THEMES = [
  { id: 'galaxy', emoji: '🌌', name: 'Galaxy Theme', desc: 'Deep space vibes — floating stars, nebula glow & cosmic gold typography.' },
  { id: 'floral', emoji: '🌸', name: 'Floral Theme', desc: 'Romantic pink petals, soft cream backgrounds & elegant serif typography.' },
  { id: 'neon', emoji: '⚡', name: 'Neon Theme', desc: 'Electric cyberpunk aesthetic — bright neon accents on a dark slate canvas.' },
  { id: 'minimal', emoji: '🤍', name: 'Minimal Theme', desc: 'Clean white space, minimal typography, and focused layout elegance.' },
  { id: 'retro', emoji: '🎞️', name: 'Retro Theme', desc: 'Warm vintage film tones, typewriter typewriter text & sepia charm.' },
  { id: 'magical', emoji: '🎈', name: 'Magical Theme', desc: 'Playful cartoonish elements — floating balloons & light pastel tones.' },
]

const HOW_IT_WORKS = [
  { n: '01', title: 'Choose Your Occasion', desc: 'Select from Birthday, Anniversary, Proposal, Kids Birthday, Graduation, or create a fully custom celebration website.', emoji: '🎯' },
  { n: '02', title: 'Fill In The Details', desc: 'Add the recipient\'s name, your heartfelt personal message, pick a beautiful visual theme & set the celebration date.', emoji: '✍️' },
  { n: '03', title: 'Upload Photos & Music', desc: 'Add up to 8 photos, choose a preset music track or upload your own song, even record a personal voice message.', emoji: '📸' },
  { n: '04', title: 'Secure Check & Go Live', desc: 'Complete secure payment and go live instantly with selected themes, or choose a handcrafted delivery option.', emoji: '✅' },
]

const FEATURES = [
  { icon: Images, title: 'Photo Gallery', desc: 'Upload up to 8 photos in a stunning animated slideshow.', color: '#ff9e4f' },
  { icon: Music2, title: 'Custom Music & Voice', desc: 'Choose from preset tracks, upload your own song, or record a voice note.', color: '#ff6f9c' },
  { icon: Clock, title: 'Countdown Reveal', desc: 'Lock the site until the big day with an animated countdown timer.', color: '#ffbe3d' },
  { icon: MessageCircle, title: 'Guest Wishes Section', desc: 'Allow friends & family to leave messages on the surprise page.', color: '#ff7d6b' },
  { icon: Lock, title: 'Password Protected', desc: 'Ensure absolute privacy with optional passcode protection.', color: '#f7a83a' },
  { icon: Gift, title: '6 Premium Themes', desc: 'Pick the theme that matches their vibe perfectly.', color: '#fb923c' },
  { icon: Zap, title: 'Instant Delivery Available', desc: 'Launch selected ready-to-go themes instantly, with express delivery for custom touches.', color: '#ff9e4f' },
  { icon: Share2, title: 'Easy Sharing', desc: 'Get one beautiful link to share via WhatsApp, Instagram, or email.', color: '#ff6f9c' },
  { icon: Shield, title: 'Hosted 1 Full Year', desc: 'Secure hosting active for 365 days of celebration.', color: '#ffbe3d' },
]

const TESTIMONIALS = [
  { init: 'PM', name: 'Priya Mehta', loc: 'Mumbai', occ: 'Birthday', c: '#ff9e4f', bg: 'rgba(255,158,79,0.14)',
    text: 'My husband literally cried when he saw it. The photos, the music, the messages from family — it was beyond anything I could have imagined. Pure magic! 🥹', rating: 5 },
  { init: 'RS', name: 'Rahul Sharma', loc: 'Delhi', occ: 'Proposal', c: '#ff6f9c', bg: 'rgba(255,111,156,0.14)',
    text: 'I proposed using the website and she said YES! The countdown, the love story, the photos — she was completely speechless. Best decision of my life.', rating: 5 },
  { init: 'AS', name: 'Arjun & Sneha', loc: 'Bangalore', occ: 'Anniversary', c: '#ff5f8f', bg: 'rgba(255,95,143,0.14)',
    text: 'For our 10th anniversary, the team created a beautiful timeline of our decade together. Our entire family is still talking about it months later!', rating: 5 },
  { init: 'KN', name: 'Kavya Nair', loc: 'Kochi', occ: 'Kids Birthday', c: '#ffbe3d', bg: 'rgba(255,190,61,0.14)',
    text: 'My daughter\'s 5th birthday website had her favourite characters and all her friends\' wishes. She watches it every week — her most treasured memory!', rating: 5 },
  { init: 'VP', name: 'Vikram Patel', loc: 'Ahmedabad', occ: 'Graduation', c: '#f7a83a', bg: 'rgba(247,168,58,0.14)',
    text: 'Made a graduation surprise for my sister — prof messages, college memories, achievement showcase. She cried happy tears. Best ₹299 ever spent!', rating: 5 },
]

const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 2,
  left: Math.random() * 100,
  delay: Math.random() * 10,
  dur: Math.random() * 8 + 8,
  color: ['#ff9e4f', '#ff6f9c', '#ffcf7a', '#ff8a5c', '#ffe6b0'][Math.floor(Math.random() * 5)],
}))

/* ─── Reusable: Section Header ─────────────────────────────────────────────── */
function SectionHeader({ label, labelColor, title, sub, inView }: {
  label: string; labelColor: string; title: React.ReactNode; sub?: string; inView: boolean
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 64 }}>
      <motion.span
        initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
        style={{ display: 'block', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '0.8rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.16em', color: labelColor, marginBottom: 16 }}>
        {label}
      </motion.span>
      <motion.h2 className="serif"
        initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}
        style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.2, color: '#fff5ec', letterSpacing: '-0.02em' }}>
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.5, delay: 0.25 }}
          style={{ marginTop: 20, color: '#b9a6be', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          {sub}
        </motion.p>
      )}
    </div>
  )
}

/* ─── AUTH MODAL ───────────────────────────────────────────────────────────── */
function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  if (!isOpen) return null

  const getRedirectUrl = (path: string) => {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const base = isDev ? 'http://localhost:3000' : window.location.origin;
    return `${base}${path}`;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
    if (isSignUp) {
      window.location.href = getRedirectUrl('/register') + '?email=' + encodeURIComponent(email) + '&name=' + encodeURIComponent(name);
    } else {
      window.location.href = getRedirectUrl('/login') + '?email=' + encodeURIComponent(email);
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
        className="auth-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-close-btn" onClick={onClose} style={{ zIndex: 10 }}>
          <X size={20} />
        </button>

        <div className="login">
          <span className="h1">
            {isSignUp ? 'Sign Up' : 'Log In'} to <span className="ui">Just4You</span>
          </span>

          <p style={{ fontSize: '0.72em', color: '#b9a6be', margin: '10px 0 0 0', lineHeight: 1.5 }}>
            {isSignUp
              ? "Enter your details and we'll take you to the app to finish creating your account."
              : "Enter your email and we'll take you to the app to sign in securely."}
          </p>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {isSignUp && (
              <input 
                type="text" 
                placeholder="Name" 
                value={name}
                onChange={e => setName(e.target.value)}
                required 
              />
            )}
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
            <input 
              type="submit" 
              className="btn" 
              value={isSignUp ? 'Continue to Sign Up' : 'Continue to Log In'} 
            />
          </form>

          <div style={{ marginTop: 'auto', paddingTop: '20px', textAlign: 'center', fontSize: '0.75em' }}>
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setName(''); setEmail(''); }} 
              style={{ background: 'none', border: 'none', color: '#ffb877', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', outline: 'none' }}
            >
              {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── NAVBAR ────────────────────────────────────────────────────────────────── */
function Navbar({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navItems = [
    { label: 'How It Works', href: '#how' },
    { label: 'Occasions',    href: '#occasions' },
    { label: 'Features',     href: '#features' },
    { label: 'Custom Sites', href: '#custom-websites' },
    { label: 'Pricing',      href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
  ]

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(24,16,30,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,224,196,0.09)' : 'none',
        transition: 'all 0.35s',
      }}>
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#ff8a5c,#ff5f93)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={15} color="white" />
          </div>
          <span className="serif" style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff5ec', letterSpacing: '0.02em' }}>
            Just4You<span className="g-text-gold">.buzz</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hide-sm" style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {navItems.map(n => (
            <a key={n.label} href={n.href}
              style={{ color: '#b9a6be', fontSize: '0.92rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffb877'}
              onMouseLeave={e => e.currentTarget.style.color = '#b9a6be'}>
              {n.label}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/login" className="hide-sm" style={{ background: 'none', border: 'none', color: '#b9a6be', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, padding: '10px 8px', transition: 'color 0.2s', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff5ec'}
            onMouseLeave={e => e.currentTarget.style.color = '#b9a6be'}>
            Sign In
          </a>
          <button onClick={onOpenAuth} className="btn btn-main hide-sm" style={{ padding: '12px 24px', fontSize: '0.9rem' }}>
            Create Surprise
          </button>
          <button className="show-sm" onClick={() => setOpen(!open)}
            style={{ background: 'none', border: 'none', color: '#fff5ec', cursor: 'pointer', padding: 4 }}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(24,16,30,0.97)', borderTop: '1px solid rgba(255,224,196,0.09)', overflow: 'hidden' }}>
            <div className="wrap" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {navItems.map(n => (
                <a key={n.label} href={n.href} onClick={() => setOpen(false)}
                  style={{ color: '#b9a6be', fontSize: '1.05rem', textDecoration: 'none', fontWeight: 500 }}>{n.label}</a>
              ))}
              <hr style={{ borderColor: 'rgba(255,224,196,0.09)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href="/login" onClick={() => setOpen(false)} style={{ background: 'none', border: '1px solid rgba(255,224,196,0.18)', borderRadius: '50px', color: '#fff5ec', cursor: 'pointer', padding: '12px', fontSize: '1rem', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
                  Sign In
                </a>
                <button onClick={() => { setOpen(false); onOpenAuth(); }} className="btn btn-main" style={{ textAlign: 'center', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
                  Create Surprise — from ₹149
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

/* ─── HERO ──────────────────────────────────────────────────────────────────── */
function Hero({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [currentOcc, setCurrentOcc] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  // Particles use Math.random(), so generate them only on the client (after
  // mount) to avoid a server/client hydration mismatch.
  const [particles, setParticles] = useState<typeof PARTICLES>([])
  useEffect(() => {
    setParticles(PARTICLES)
    const t = setInterval(() => setCurrentOcc(c => (c + 1) % OCCASIONS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const storyMoments = [
    { Icon: Images, label: 'Favorite photos' },
    { Icon: Music2, label: 'Their song' },
    { Icon: Clock, label: 'Midnight reveal' },
    { Icon: Heart, label: 'Your message' },
    { Icon: Zap, label: 'Instantly live' },
  ]

  return (
    <section style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      padding: '120px 0 80px',
      background: 'radial-gradient(ellipse 85% 65% at 50% -5%, rgba(255,120,150,0.14) 0%, #18101e 66%)',
    }}>
      {/* Ambient Orbs */}
      <div className="orb" style={{ width:650,height:650,top:'-18%',left:'-12%',background:'radial-gradient(circle,#ff9e4f,transparent 70%)',opacity:0.14 }} />
      <div className="orb" style={{ width:500,height:500,bottom:'-10%',right:'-10%',background:'radial-gradient(circle,#ff5f93,transparent 70%)',opacity:0.12 }} />
      
      {/* Grid Pattern overlay */}
      <div style={{ position:'absolute',inset:0,zIndex:0,
        backgroundImage:'linear-gradient(rgba(255,225,200,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,225,200,0.02) 1px,transparent 1px)',
        backgroundSize:'80px 80px' }} />

      {/* Floating Particles */}
      {particles.map(p => (
        <div key={p.id} className="p" style={{ width:p.size,height:p.size,left:`${p.left}%`,
          background:p.color,animationDelay:`${p.delay}s`,animationDuration:`${p.dur}s`,opacity:0.45 }} />
      ))}

      <div style={{ position:'relative',zIndex:10,width:'100%' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign:'center' }}>

          {/* Occasion Switcher Pill */}
          <motion.div
            initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2,duration:0.7 }}
            style={{ display:'inline-flex',alignItems:'center',gap:10,
              background:'rgba(255,158,79,0.08)',border:'1px solid rgba(255,158,79,0.24)',
              borderRadius:50,padding:'10px 22px',marginBottom:40 }}>
            <AnimatePresence mode="wait">
              <motion.span key={currentOcc}
                initial={{ opacity:0,y:6 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-6 }}
                transition={{ duration:0.35 }}
                style={{ fontSize:'1.1rem' }}>
                {OCCASIONS[currentOcc].emoji}
              </motion.span>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.span key={`t-${currentOcc}`}
                initial={{ opacity:0,y:6 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-6 }}
                transition={{ duration:0.35 }}
                style={{ fontWeight:600,fontSize:'0.9rem',color:'#ffb877',fontFamily:"'Plus Jakarta Sans',sans-serif",letterSpacing:'0.02em' }}>
                Instant delivery available · {OCCASIONS[currentOcc].title}
              </motion.span>
            </AnimatePresence>
            <Sparkles size={14} style={{ color:'#ffb877' }} />
          </motion.div>

          {/* Cinematic Headline */}
          <motion.h1 className="serif"
            initial={{ opacity:0,y:40 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.35,duration:0.9,ease:[0.22,1,0.36,1] }}
            style={{ fontSize:'clamp(2.5rem, 6.5vw, 4.8rem)',fontWeight:900,lineHeight:1.15,letterSpacing:'-0.03em',
              color:'#fff5ec',marginBottom:24 }}>
            Make Every Celebration <br />
            <span className="hero-headline-finish">
              <span className="g-text">Unforgettable.</span>
              <motion.span className="hero-headline-spark" aria-hidden="true"
                animate={shouldReduceMotion?undefined:{ rotate:[-8,8,-8],scale:[1,1.14,1] }}
                transition={shouldReduceMotion?undefined:{ duration:2.8,repeat:Infinity,ease:'easeInOut' }}>✨</motion.span>
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity:0,y:22 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.55,duration:0.7 }}
            style={{ fontSize:'1.15rem',lineHeight:1.8,color:'#b9a6be',
              maxWidth:620,margin:'0 auto 48px',fontWeight:400,letterSpacing:'0.01em' }}>
            Create a personalized surprise website with photos, music, timelines and heartfelt messages. Pick an instant-delivery theme or make every detail your own.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity:0,y:22 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.7,duration:0.7 }}
            style={{ display:'flex',flexWrap:'wrap',gap:16,justifyContent:'center',alignItems:'center',marginBottom:42 }}>
            <button onClick={onOpenAuth} className="btn btn-main" style={{ fontSize:'1.05rem',padding:'16px 36px' }}>
              Create My Surprise Website <ArrowRight size={18} />
            </button>
            <a href={appUrl('/demo')} className="btn btn-ghost" style={{ fontSize:'1.05rem',padding:'15px 32px' }}>
              <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(255,240,228,0.12)',
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Play size={12} fill="currentColor" />
              </div>
              See Live Demos
            </a>
          </motion.div>

          <motion.div className="hero-story-reel"
            initial={shouldReduceMotion?false:{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }}
            transition={{ delay:0.82,duration:0.7 }} aria-label="Your surprise website story">
            <motion.div className="hero-story-track"
              animate={shouldReduceMotion?undefined:{ x:['0%','-50%'] }}
              transition={shouldReduceMotion?undefined:{ duration:18,repeat:Infinity,ease:'linear' }}>
              {[...storyMoments,...storyMoments].map(({ Icon,label },index) => (
                <div className="hero-story-moment" key={`${label}-${index}`} aria-hidden={index >= storyMoments.length}>
                  <span><Icon size={15} /></span>
                  <strong>{label}</strong>
                  <ArrowRight size={13} className="hero-story-arrow" />
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.85,duration:0.6 }}
            style={{ display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'24px 64px', width: '100%',
              paddingTop:36,borderTop:'1px solid rgba(255,224,196,0.09)' }}>
            {[['6','Stunning Themes'],['Instant','Delivery Available'],['1 Year','Hosting Included'],['₹149','Starting Price']].map(([v,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div className="g-text-gold" style={{ fontSize:'1.8rem',fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{v}</div>
                <div style={{ fontSize:'0.8rem',color:'#8f8098',marginTop:6,fontWeight:500,letterSpacing:'0.04em',textTransform:'uppercase' }}>{l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ─── HOW IT WORKS ──────────────────────────────────────────────────────────── */
function HowItWorks({ onOpenAuth }: { onOpenAuth: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="how" ref={ref} style={{ position:'relative',padding:'120px 0',background:'#18101e',overflow:'hidden' }}>
      <div className="orb" style={{ width:420,height:420,top:'20%',right:'-12%',background:'radial-gradient(circle,#ff9e4f,transparent 70%)',opacity:0.08 }} />
      <div className="wrap">
        <SectionHeader label="Step by Step" labelColor="#ff9e4f"
          title={<>How It Works — <span className="g-text">4 Simple Steps</span></>}
          sub="From idea to a beautiful surprise website in just minutes — no technical skills needed."
          inView={inView} />

        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:28,position:'relative' }}>
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={step.n}
              initial={{ opacity:0, y:40 }} animate={inView?{opacity:1,y:0}:{}}
              transition={{ duration:0.6, delay:i*0.12 }}
              style={{ position:'relative',padding:'36px 28px',borderRadius:20,
                background:'rgba(255,240,228,0.03)',border:'1px solid rgba(255,224,196,0.09)' }}>
              {/* Step number */}
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'0.75rem',fontWeight:800,
                letterSpacing:'0.12em',color:'rgba(255,175,110,0.6)',marginBottom:18 }}>{step.n}</div>
              {/* Icon */}
              <div style={{ fontSize:'2.6rem',marginBottom:20 }}>{step.emoji}</div>
              <h3 style={{ fontSize:'1.1rem',fontWeight:700,color:'#fff5ec',marginBottom:12 }}>{step.title}</h3>
              <p style={{ fontSize:'0.92rem',color:'#8f8098',lineHeight:1.7 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA button */}
        <motion.div
          initial={{ opacity:0,y:20 }} animate={inView?{opacity:1,y:0}:{}} transition={{ delay:0.5,duration:0.6 }}
          style={{ textAlign:'center',marginTop:64 }}>
          <button onClick={onOpenAuth} className="btn btn-main" style={{ fontSize:'1.05rem',padding:'16px 40px' }}>
            Start Creating Now <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── OCCASIONS ─────────────────────────────────────────────────────────────── */
function Occasions({ onOpenAuth }: { onOpenAuth: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="occasions" ref={ref} style={{ position:'relative',padding:'120px 0',overflow:'hidden',
      background:'linear-gradient(180deg,#18101e 0%,#201430 50%,#18101e 100%)' }}>
      <div className="orb" style={{ width:450,height:450,bottom:'5%',left:'-10%',background:'radial-gradient(circle,#ff5f93,transparent 70%)',opacity:0.08 }} />
      <div className="wrap">
        <SectionHeader label="What We Create" labelColor="#ff6f9c"
          title={<>Every Moment Deserves <span className="g-text">Something Beautiful</span></>}
          sub="From birthdays to proposals — we craft personalized digital experiences that leave people speechless."
          inView={inView} />

        <div className="three-col" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24 }}>
          {OCCASIONS.map((occ, i) => (
            <motion.div key={occ.title}
              initial={{ opacity:0, y:38 }} animate={inView?{opacity:1,y:0}:{}}
              transition={{ duration:0.55, delay:(i%3)*0.1 }}
              whileHover={{ y:-6, transition:{ duration:0.22 } }}
              style={{ padding:'32px',borderRadius:20,cursor:'pointer',
                background:occ.bg,border:`1px solid ${occ.border}`,
                display:'flex',flexDirection:'column',gap:16,position:'relative' }}
              onClick={onOpenAuth}>
              {/* Tag */}
              <span style={{ position:'absolute',top:18,right:18,fontSize:'0.75rem',fontWeight:600,
                padding:'4px 12px',borderRadius:50,background:`${occ.c}15`,color:occ.c }}>{occ.tag}</span>
              {/* Emoji */}
              <div style={{ width:54,height:54,borderRadius:16,fontSize:'1.6rem',
                display:'flex',alignItems:'center',justifyContent:'center',
                background:'rgba(255,240,228,0.05)',border:'1px solid rgba(255,224,196,0.1)' }}>{occ.emoji}</div>
              <div>
                <h3 className="serif" style={{ color:'#fff5ec',fontSize:'1.15rem',fontWeight:700,marginBottom:10 }}>{occ.title}</h3>
                <p style={{ color:'#b9a6be',fontSize:'0.9rem',lineHeight:1.65 }}>{occ.desc}</p>
              </div>
              <span style={{ display:'flex',alignItems:'center',gap:5,color:occ.c,
                fontSize:'0.88rem',fontWeight:600,marginTop:'auto',paddingTop:12 }}>
                Create Surprise Website →
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FEATURES GRID ─────────────────────────────────────────────────────────── */
function FeaturesGrid() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="features" ref={ref} style={{ position:'relative',padding:'120px 0',background:'#18101e',overflow:'hidden' }}>
      <div className="orb" style={{ width:400,height:400,top:'30%',left:'-12%',background:'radial-gradient(circle,#ff9e4f,transparent 70%)',opacity:0.08 }} />
      <div className="wrap">
        <SectionHeader label="Why Just4You.buzz" labelColor="#ff9e4f"
          title={<>Everything You Need to <span className="g-text">Wow Them</span></>}
          sub="Every single detail is designed to make your loved one feel treasured — nothing is an afterthought."
          inView={inView} />

        <div className="three-col" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24 }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity:0,y:36 }} animate={inView?{opacity:1,y:0}:{}}
              transition={{ duration:0.5,delay:i*0.065 }}
              whileHover={{ y:-5,transition:{duration:0.22} }}
              style={{ padding:'28px 24px',borderRadius:20,
                background:'rgba(255,240,228,0.03)',border:'1px solid rgba(255,224,196,0.09)' }}>
              <div style={{ width:46,height:46,borderRadius:12,background:`${f.color}12`,
                display:'flex',alignItems:'center',justifyContent:'center',marginBottom:18 }}>
                <f.icon size={20} style={{ color:f.color }} />
              </div>
              <h3 style={{ fontSize:'1.05rem',fontWeight:700,color:'#fff5ec',marginBottom:10 }}>{f.title}</h3>
              <p style={{ color:'#8f8098',fontSize:'0.88rem',lineHeight:1.65 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── CUSTOM WEBSITE STUDIO ───────────────────────────────────────────────── */
function CustomWebsiteStudio() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const shouldReduceMotion = useReducedMotion()
  const services = [
    { Icon: Palette, title: 'Made for your brand', desc: 'A visual direction shaped around your audience, voice and goals.' },
    { Icon: Code2, title: 'Built for every screen', desc: 'Fast, responsive pages with thoughtful interactions and clean UX.' },
    { Icon: Rocket, title: 'Ready to launch', desc: 'From first idea to deployment, we help bring the complete site online.' },
  ]

  return (
    <section id="custom-websites" ref={ref} className="custom-studio">
      <div className="custom-studio-rule" aria-hidden="true" />
      <div className="wrap custom-studio-grid">
        <motion.div
          initial={shouldReduceMotion?false:{ opacity:0,y:34 }} animate={inView?{opacity:1,y:0}:{}}
          transition={{ duration:0.75,ease:[0.22,1,0.36,1] }}>
          <span className="custom-studio-kicker"><Globe2 size={15} /> Beyond celebrations</span>
          <h2 className="serif custom-studio-title">
            Need something entirely <span className="g-text">your own?</span>
          </h2>
          <p className="custom-studio-copy">
            We also create fully customised websites for businesses, portfolios, events and bold new ideas. Every page is designed around your story, not squeezed into a template.
          </p>

          <div className="custom-service-list">
            {services.map(({ Icon, title, desc }, index) => (
              <motion.div key={title} className="custom-service-item"
                initial={shouldReduceMotion?false:{ opacity:0,y:22 }} animate={inView?{opacity:1,y:0}:{}}
                transition={{ duration:0.55,delay:0.16 + index*0.1 }}>
                <span className="custom-service-icon"><Icon size={18} /></span>
                <span><strong>{title}</strong><small>{desc}</small></span>
              </motion.div>
            ))}
          </div>

          <motion.a href="mailto:info@novantixtech.com?subject=Custom%20website%20enquiry"
            className="btn btn-main custom-email-cta"
            initial={shouldReduceMotion?false:{ opacity:0,y:18 }} animate={inView?{opacity:1,y:0}:{}}
            transition={{ duration:0.55,delay:0.48 }}>
            <Mail size={18} /> Email info@novantixtech.com
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── THEMES ────────────────────────────────────────────────────────────────── */
function ThemeShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section style={{ position:'relative',padding:'120px 0',overflow:'hidden',
      background:'linear-gradient(180deg,#18101e 0%,#201430 50%,#18101e 100%)' }}>
      <div ref={ref} className="wrap">
        <SectionHeader label="Visual Themes" labelColor="#ffcf7a"
          title={<>Premium Themes — <span className="g-text">Choose the Mood</span></>}
          sub="Every layout option is meticulously formatted to present your story beautifully on all screens."
          inView={inView} />

        <div className="three-col" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24 }}>
          {THEMES.map((t, i) => (
            <motion.a key={t.name} href={appUrl(`/demo/${t.id}`)}
              initial={{ opacity:0,scale:0.96 }} animate={inView?{opacity:1,scale:1}:{}}
              transition={{ duration:0.5,delay:i*0.08 }}
              whileHover={{ y:-6 }}
              style={{ padding: '30px 24px', borderRadius:20, border:'1px solid rgba(255,224,196,0.09)', background:'rgba(255,240,228,0.02)', display: 'flex', flexDirection: 'column', gap: 14, textDecoration:'none', cursor:'pointer' }}>
              <div style={{ fontSize:'2.4rem', marginBottom: 6 }}>{t.emoji}</div>
              <div style={{ fontWeight:700,fontSize:'1.1rem',color:'#fff5ec' }}>{t.name}</div>
              <div style={{ color:'#8f8098',fontSize:'0.88rem',lineHeight:1.6 }}>{t.desc}</div>
              <div style={{ marginTop:'auto',color:'#ff9e4f',fontSize:'0.85rem',fontWeight:600,display:'flex',alignItems:'center',gap:6 }}>
                View live demo <ArrowRight size={14} />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── TESTIMONIALS ──────────────────────────────────────────────────────────── */
function Testimonials() {
  const [cur, setCur] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const t = TESTIMONIALS[cur]

  return (
    <section id="testimonials" ref={ref} style={{ position:'relative',padding:'120px 0',overflow:'hidden',
      background:'#18101e' }}>
      <div className="orb" style={{ width:380,height:380,top:'10%',right:'-8%',background:'radial-gradient(circle,#ff5f93,transparent 70%)',opacity:0.08 }} />
      <div className="wrap" style={{ maxWidth:780 }}>
        <SectionHeader label="Real Stories" labelColor="#ff6f9c"
          title={<>They Cried <span className="g-text">Happy Tears</span></>}
          sub="Every surprise tells a story. Here are a few of our favourites."
          inView={inView} />

        <motion.div initial={{ opacity:0,y:30 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.7,delay:0.2 }}>
          <AnimatePresence mode="wait">
            <motion.div key={cur}
              initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-16 }}
              transition={{ duration:0.35 }}
              style={{ borderRadius:24,padding:'48px',background:'rgba(255,240,228,0.03)',border:'1px solid rgba(255,224,196,0.09)' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
                <span style={{ fontSize:'0.8rem',fontWeight:600,padding:'5px 14px',borderRadius:50,background:t.bg,color:t.c,letterSpacing:'0.02em' }}>
                  {t.occ}
                </span>
                <div style={{ display:'flex',gap:4 }}>
                  {Array.from({length:t.rating}).map((_,i) => <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />)}
                </div>
              </div>
              <Quote size={28} style={{ color:t.c,opacity:0.4,marginBottom:18 }} />
              <p style={{ color:'#efe1d6',fontSize:'1.1rem',lineHeight:1.8,fontStyle:'italic',marginBottom:32 }}>"{t.text}"</p>
              <div style={{ display:'flex',alignItems:'center',gap:16 }}>
                <div style={{ width:46,height:46,borderRadius:'50%',flexShrink:0,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  background:t.bg,color:t.c,fontWeight:700,fontSize:'0.9rem',border:`2px solid ${t.c}30` }}>
                  {t.init}
                </div>
                <div>
                  <div style={{ color:'#fff5ec',fontWeight:600,fontSize:'0.98rem' }}>{t.name}</div>
                  <div style={{ color:'#8f8098',fontSize:'0.8rem',marginTop:2 }}>{t.loc} · {t.occ} Website</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slider Controls */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginTop:32 }}>
            <button onClick={() => setCur(c => (c-1+TESTIMONIALS.length)%TESTIMONIALS.length)}
              style={{ width:40,height:40,borderRadius:'50%',background:'rgba(255,240,228,0.05)',
                border:'1px solid rgba(255,224,196,0.1)',color:'#b9a6be',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',transition:'color 0.2s,border-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,158,79,0.4)'; e.currentTarget.style.color='#fff5ec' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,224,196,0.1)'; e.currentTarget.style.color='#b9a6be' }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ display:'flex',gap:8 }}>
              {TESTIMONIALS.map((_,i) => (
                <button key={i} onClick={() => setCur(i)}
                  style={{ width:i===cur?24:8,height:8,borderRadius:4,border:'none',cursor:'pointer',padding:0,
                    transition:'all 0.3s',background:i===cur?'#ffb877':'rgba(255,224,196,0.16)' }} />
              ))}
            </div>
            <button onClick={() => setCur(c => (c+1)%TESTIMONIALS.length)}
              style={{ width:40,height:40,borderRadius:'50%',background:'rgba(255,240,228,0.05)',
                border:'1px solid rgba(255,224,196,0.1)',color:'#b9a6be',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',transition:'color 0.2s,border-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,158,79,0.4)'; e.currentTarget.style.color='#fff5ec' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,224,196,0.1)'; e.currentTarget.style.color='#b9a6be' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── PRICING ───────────────────────────────────────────────────────────────── */
function Pricing() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const tiers = [
    {
      id: 'lite', name: 'Lite', price: 149, tagline: 'The essentials to delight someone.',
      features: ['1 premium animated theme', 'Up to 5 photos', 'A preset music track', 'Guest wishes & reactions', '1 year hosting'],
    },
    {
      id: 'classic', name: 'Classic', price: 326, tagline: 'Our most-loved mix of memories & music.', badge: 'Most Popular',
      features: ['Everything in Lite', '📸 Up to 25 photos', '🎵 Upload your own song', '⏳ Countdown reveal'],
    },
    {
      id: 'grand', name: 'Grand', price: 504, tagline: 'Everything, for an unforgettable surprise.', badge: 'Best Value',
      features: ['Everything in Classic', '🎤 Personal voice message', '⚡ Rush 6-hour delivery'],
    },
  ]

  return (
    <section id="pricing" ref={ref} style={{ position:'relative',padding:'120px 0',background:'linear-gradient(180deg,#18101e 0%,#201430 60%,#18101e 100%)',overflow:'hidden' }}>
      <div className="orb" style={{ width:500,height:500,top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'radial-gradient(circle,#ff9e4f,transparent 70%)',opacity:0.07 }} />
      <div className="wrap" style={{ maxWidth:1020 }}>
        <SectionHeader label="Simple Pricing" labelColor="#ff8a5c"
          title={<>Build Your Own <span className="g-text">Package.</span></>}
          sub="Start from ₹149 and add only the features you want. No subscriptions — pay once, surprise them forever."
          inView={inView} />

        <div className="three-col" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,alignItems:'stretch' }}>
          {tiers.map((t, i) => {
            const featured = t.badge === 'Most Popular'
            return (
              <motion.div key={t.id}
                initial={{ opacity:0,y:40 }} animate={inView?{opacity:1,y:0}:{}}
                transition={{ duration:0.6,delay:i*0.1 }}
                style={{ position:'relative',display:'flex',flexDirection:'column',padding:'32px 28px',borderRadius:22,
                  border:featured?'1px solid rgba(255,138,92,0.5)':'1px solid rgba(255,224,196,0.09)',
                  background:featured?'linear-gradient(135deg,rgba(255,138,92,0.1),rgba(255,95,147,0.06))':'rgba(255,240,228,0.02)',
                  boxShadow:featured?'0 24px 60px rgba(0,0,0,0.4)':'none' }}>
                {t.badge && (
                  <span style={{ position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',whiteSpace:'nowrap',
                    padding:'5px 14px',borderRadius:50,fontSize:'0.72rem',fontWeight:800,color:'#fff',
                    background:'linear-gradient(135deg,#ff8a5c,#ff5f93)' }}>{t.badge}</span>
                )}
                <div style={{ fontWeight:800,fontSize:'1.25rem',color:'#fff5ec',marginBottom:6 }}>{t.name}</div>
                <div style={{ color:'#8f8098',fontSize:'0.85rem',marginBottom:18,minHeight:38 }}>{t.tagline}</div>
                <div className="g-text-gold" style={{ fontSize:'2.6rem',fontWeight:900,lineHeight:1,marginBottom:22,fontFamily:"'Plus Jakarta Sans',sans-serif" }}>₹{t.price}</div>
                <div style={{ display:'flex',flexDirection:'column',gap:12,marginBottom:28,flex:1 }}>
                  {t.features.map(f => (
                    <div key={f} style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
                      <div style={{ width:18,height:18,borderRadius:'50%',background:'rgba(255,158,79,0.14)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1 }}>
                        <Check size={10} style={{ color:'#ffb877' }} />
                      </div>
                      <span style={{ color:'#b9a6be',fontSize:'0.86rem',lineHeight:1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={appUrl('/pricing')} className={featured ? 'btn btn-main' : 'btn btn-ghost'} style={{ justifyContent:'center',fontSize:'0.98rem',padding:'14px' }}>
                  Choose {t.name} <ArrowRight size={15} />
                </a>
              </motion.div>
            )
          })}
        </div>

        <div style={{ textAlign:'center',marginTop:36 }}>
          <a href={appUrl('/pricing')} style={{ color:'#ff9e4f',fontSize:'0.92rem',fontWeight:600,textDecoration:'none' }}>
            Or build a fully custom package →
          </a>
          <p style={{ color:'#6a5d73',fontSize:'0.82rem',fontWeight:500,marginTop:16 }}>
            🔒 Secure payments via Razorpay &nbsp;·&nbsp; 📞 WhatsApp Support &nbsp;·&nbsp; ✅ 1 Year Hosting
          </p>
        </div>
      </div>
    </section>
  )
}

/* ─── FINAL CTA ─────────────────────────────────────────────────────────────── */
function FinalCTA({ onOpenAuth }: { onOpenAuth: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section ref={ref} style={{ position:'relative',padding:'120px 0',overflow:'hidden',background:'#18101e' }}>
      <div className="orb" style={{ width:550,height:550,top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'radial-gradient(circle,#ff9e4f,transparent 70%)',opacity:0.09 }} />
      <div className="wrap" style={{ maxWidth:860,textAlign:'center' }}>
        <motion.div
          initial={{ opacity:0,y:48 }} animate={inView?{opacity:1,y:0}:{}}
          transition={{ duration:1,ease:[0.22,1,0.36,1] }}
          className="gb"
          style={{ background:'linear-gradient(135deg,#221530,#2a1a24)' }}>
          <div style={{ padding:'64px 56px',borderRadius:22 }}>
            <div className="float" style={{ fontSize:'3.6rem',marginBottom:24 }}>✨</div>
            <h2 className="serif" style={{ fontSize:'clamp(2.1rem,4.5vw,3rem)',fontWeight:700,color:'#fff5ec',lineHeight:1.2,marginBottom:12 }}>
              Your Story Deserves More
            </h2>
            <h2 className="serif g-text" style={{ fontSize:'clamp(2.1rem,4.5vw,3rem)',fontWeight:700,lineHeight:1.2,marginBottom:24 }}>
              Than a Disposable Card.
            </h2>
            <p style={{ color:'#b9a6be',fontSize:'1.08rem',lineHeight:1.75,maxWidth:500,margin:'0 auto 40px' }}>
              Create a magical digital surprise page that your loved ones will open, cherish, and remember forever — starting at just ₹149.
            </p>
            <div style={{ display:'flex',flexWrap:'wrap',gap:16,justifyContent:'center' }}>
              <button onClick={onOpenAuth} className="btn btn-main" style={{ fontSize:'1.05rem',padding:'16px 36px' }}>
                Create Surprise Website <ArrowRight size={18} />
              </button>
            </div>
            <p style={{ marginTop:36,color:'#6a5d73',fontSize:'0.84rem',fontWeight:500 }}>
              ✨ 6 beautiful themes &nbsp;·&nbsp; ⚡ Instant delivery available &nbsp;·&nbsp; 🔒 Secure Razorpay checkout
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── FOOTER ─────────────────────────────────────────────────────────────────── */
function Footer({ onOpenAuth }: { onOpenAuth: () => void }) {
  const socials = [
    { Icon: Camera, label: 'Instagram', color: '#f472b6' },
    { Icon: X,      label: 'Twitter/X', color: '#ffb877' },
    { Icon: Mail,   label: 'Email',     color: '#fbbf24', href: 'mailto:info@novantixtech.com' },
  ]
  return (
    <footer style={{ background:'#0f0913',borderTop:'1px solid rgba(255,224,196,0.07)',padding:'64px 0 32px' }}>
      <div className="wrap">
        <div className="two-col" style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:64,marginBottom:64 }}>
          {/* Brand details */}
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
              <div style={{ width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#ff8a5c,#ff5f93)',
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Sparkles size={14} color="white" />
              </div>
              <span className="serif" style={{ fontWeight:700,fontSize:'1.15rem',color:'#fff5ec' }}>
                Just4You<span className="g-text-gold">.buzz</span>
              </span>
            </div>
            <p style={{ color:'#8f8098',fontSize:'0.88rem',lineHeight:1.7,maxWidth:300,marginBottom:24 }}>
              Turning Special Moments Into Beautiful Digital Memories. Premium personalized surprise websites since 2023.
            </p>
            <div style={{ display:'flex',gap:12 }}>
              {socials.map(({Icon,label,color,href}) => (
                <a key={label} href={href ?? '#'} title={label}
                  style={{ width:36,height:36,borderRadius:'50%',background:'rgba(255,240,228,0.05)',
                    border:'1px solid rgba(255,224,196,0.1)',color:'#8f8098',display:'flex',alignItems:'center',
                    justifyContent:'center',textDecoration:'none',transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=color; e.currentTarget.style.color=color }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,224,196,0.1)'; e.currentTarget.style.color='#8f8098' }}>
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Occasions list */}
          <div>
            <h4 style={{ color:'#efe1d6',fontSize:'0.92rem',fontWeight:700,marginBottom:20 }}>Occasions</h4>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {['Birthday','Anniversary','Proposal','Kids Birthday','Graduation','Custom'].map(item => (
                <a key={item} href="#occasions"
                  style={{ color:'#8f8098',textDecoration:'none',fontSize:'0.88rem',transition:'color 0.2s',fontWeight:500 }}
                  onMouseEnter={e => e.currentTarget.style.color='#ffb877'}
                  onMouseLeave={e => e.currentTarget.style.color='#8f8098'}>
                  {item} Website
                </a>
              ))}
            </div>
          </div>

          {/* Company links */}
          <div>
            <h4 style={{ color:'#efe1d6',fontSize:'0.92rem',fontWeight:700,marginBottom:20 }}>Links</h4>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {['How It Works','Pricing','Testimonials','Privacy Policy','Terms of Service','Contact Us'].map(item => (
                <button key={item} onClick={onOpenAuth}
                  style={{ background: 'none', border: 'none', padding: 0, textDecoration:'none', textAlign: 'left', cursor: 'pointer', color:'#8f8098',fontSize:'0.88rem',transition:'color 0.2s',fontWeight:500 }}
                  onMouseEnter={e => e.currentTarget.style.color='#ffb877'}
                  onMouseLeave={e => e.currentTarget.style.color='#8f8098'}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
          paddingTop:24,borderTop:'1px solid rgba(255,224,196,0.07)',flexWrap:'wrap',gap:16 }}>
          <p style={{ color:'#6a5d73',fontSize:'0.82rem',fontWeight:500 }}>© 2026 Just4You.buzz · All rights reserved</p>
          <p style={{ color:'#6a5d73',fontSize:'0.82rem',display:'flex',alignItems:'center',gap:5,fontWeight:500 }}>
            A product from <a href="https://novantixtech.com" target="_blank" rel="noopener noreferrer"
              style={{ color:'#ffb877',textDecoration:'none',fontWeight:700 }}>NovantixTech.com</a>
            <Heart size={11} style={{ color:'#ff5f93' }} fill="#ff5f93" />
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ─── ROOT APP ───────────────────────────────────────────────────────────────── */
export default function LandingClient() {
  const router = useRouter()

  // "Create / Sign In" CTAs go straight to the web app's real auth pages,
  // which then lead into the dashboard after login/signup.
  const handleOpenAuth = () => router.push('/register')

  return (
    <div style={{ background: '#18101e', minHeight: '100vh' }}>
      <Navbar onOpenAuth={handleOpenAuth} />
      <Hero onOpenAuth={handleOpenAuth} />
      <HowItWorks onOpenAuth={handleOpenAuth} />
      <Occasions onOpenAuth={handleOpenAuth} />
      <ThemeShowcase />
      <FeaturesGrid />
      <CustomWebsiteStudio />
      <Testimonials />
      <Pricing />
      <FinalCTA onOpenAuth={handleOpenAuth} />
      <Footer onOpenAuth={handleOpenAuth} />
    </div>
  )
}
