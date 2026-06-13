import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, Play, Check, Star, ChevronLeft, ChevronRight,
  Quote, Music2, Images, Lock, Clock, MessageCircle, Gift, Zap, Shield, Share2,
  Menu, X, Heart, Camera, Mail
} from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const OCCASIONS = [
  { emoji: '🎂', title: 'Birthday Websites', tag: 'Most Popular', c: '#c084fc', bg: 'rgba(192,132,252,0.06)', border: 'rgba(192,132,252,0.15)',
    desc: 'A personalized birthday page packed with photos, music, countdown & a heartfelt surprise reveal.' },
  { emoji: '💍', title: 'Anniversary Websites', tag: 'Most Romantic', c: '#f472b6', bg: 'rgba(244,114,182,0.06)', border: 'rgba(244,114,182,0.15)',
    desc: 'Celebrate years of togetherness with a stunning timeline of shared memories & love letters.' },
  { emoji: '💌', title: 'Proposal Websites', tag: 'Trending', c: '#fb7185', bg: 'rgba(251,113,133,0.06)', border: 'rgba(251,113,133,0.15)',
    desc: 'Pop the question with a cinematic digital story — photos, vows & a Yes/No reveal moment.' },
  { emoji: '🧸', title: 'Kids Birthday', tag: 'Adorable', c: '#34d399', bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.15)',
    desc: 'Colorful, playful birthday pages with balloon animations, character themes & fun surprises.' },
  { emoji: '🎓', title: 'Graduation Websites', tag: 'New ✨', c: '#fbbf24', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.15)',
    desc: 'Honour the achievement with a premium tribute — professor wishes, milestone photos & a proud message.' },
  { emoji: '🎉', title: 'Custom Celebrations', tag: 'Fully Custom', c: '#60a5fa', bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.15)',
    desc: 'Weddings, engagements, reunions, farewells — any occasion crafted beautifully, just for you.' },
]

const THEMES = [
  { emoji: '🌌', name: 'Galaxy Theme', desc: 'Deep space vibes — floating stars, nebula glow & cosmic gold typography.' },
  { emoji: '🌸', name: 'Floral Theme', desc: 'Romantic pink petals, soft cream backgrounds & elegant serif typography.' },
  { emoji: '⚡', name: 'Neon Theme', desc: 'Electric cyberpunk aesthetic — bright neon accents on a dark slate canvas.' },
  { emoji: '🤍', name: 'Minimal Theme', desc: 'Clean white space, minimal typography, and focused layout elegance.' },
  { emoji: '🎞️', name: 'Retro Theme', desc: 'Warm vintage film tones, typewriter typewriter text & sepia charm.' },
  { emoji: '🎈', name: 'Magical Theme', desc: 'Playful cartoonish elements — floating balloons & light pastel tones.' },
]

const HOW_IT_WORKS = [
  { n: '01', title: 'Choose Your Occasion', desc: 'Select from Birthday, Anniversary, Proposal, Kids Birthday, Graduation, or create a fully custom celebration website.', emoji: '🎯' },
  { n: '02', title: 'Fill In The Details', desc: 'Add the recipient\'s name, your heartfelt personal message, pick a beautiful visual theme & set the celebration date.', emoji: '✍️' },
  { n: '03', title: 'Upload Photos & Music', desc: 'Add up to 8 photos, choose a preset music track or upload your own song, even record a personal voice message.', emoji: '📸' },
  { n: '04', title: 'Secure Check & Go Live', desc: 'Complete secure payments. Your beautiful surprise website is ready within 24 hours — sometimes instantly!', emoji: '✅' },
]

const FEATURES = [
  { icon: Images, title: 'Photo Gallery', desc: 'Upload up to 8 photos in a stunning animated slideshow.', color: '#c084fc' },
  { icon: Music2, title: 'Custom Music & Voice', desc: 'Choose from preset tracks, upload your own song, or record a voice note.', color: '#f472b6' },
  { icon: Clock, title: 'Countdown Reveal', desc: 'Lock the site until the big day with an animated countdown timer.', color: '#fbbf24' },
  { icon: MessageCircle, title: 'Guest Wishes Section', desc: 'Allow friends & family to leave messages on the surprise page.', color: '#34d399' },
  { icon: Lock, title: 'Password Protected', desc: 'Ensure absolute privacy with optional passcode protection.', color: '#60a5fa' },
  { icon: Gift, title: '6 Premium Themes', desc: 'Pick the theme that matches their vibe perfectly.', color: '#fb923c' },
  { icon: Zap, title: 'Ready in 24 Hours', desc: 'Express delivery ensuring your site goes live on schedule.', color: '#c084fc' },
  { icon: Share2, title: 'Easy Sharing', desc: 'Get one beautiful link to share via WhatsApp, Instagram, or email.', color: '#f472b6' },
  { icon: Shield, title: 'Hosted 1 Full Year', desc: 'Secure hosting active for 365 days of celebration.', color: '#34d399' },
]

const TESTIMONIALS = [
  { init: 'PM', name: 'Priya Mehta', loc: 'Mumbai', occ: 'Birthday', c: '#c084fc', bg: 'rgba(192,132,252,0.12)',
    text: 'My husband literally cried when he saw it. The photos, the music, the messages from family — it was beyond anything I could have imagined. Pure magic! 🥹', rating: 5 },
  { init: 'RS', name: 'Rahul Sharma', loc: 'Delhi', occ: 'Proposal', c: '#f472b6', bg: 'rgba(244,114,182,0.12)',
    text: 'I proposed using the website and she said YES! The countdown, the love story, the photos — she was completely speechless. Best decision of my life.', rating: 5 },
  { init: 'AS', name: 'Arjun & Sneha', loc: 'Bangalore', occ: 'Anniversary', c: '#fb7185', bg: 'rgba(251,113,133,0.12)',
    text: 'For our 10th anniversary, the team created a beautiful timeline of our decade together. Our entire family is still talking about it months later!', rating: 5 },
  { init: 'KN', name: 'Kavya Nair', loc: 'Kochi', occ: 'Kids Birthday', c: '#34d399', bg: 'rgba(52,211,153,0.12)',
    text: 'My daughter\'s 5th birthday website had her favourite characters and all her friends\' wishes. She watches it every week — her most treasured memory!', rating: 5 },
  { init: 'VP', name: 'Vikram Patel', loc: 'Ahmedabad', occ: 'Graduation', c: '#fbbf24', bg: 'rgba(251,191,36,0.12)',
    text: 'Made a graduation surprise for my sister — prof messages, college memories, achievement showcase. She cried happy tears. Best ₹299 ever spent!', rating: 5 },
]

const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 2,
  left: Math.random() * 100,
  delay: Math.random() * 10,
  dur: Math.random() * 8 + 8,
  color: ['#c084fc', '#f472b6', '#fb923c', '#fbbf24', '#34d399'][Math.floor(Math.random() * 5)],
}))

/* ─── Reusable: Section Header ─────────────────────────────────────────────── */
function SectionHeader({ label, labelColor, title, sub, inView }: {
  label: string; labelColor: string; title: React.ReactNode; sub?: string; inView: boolean
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 64 }}>
      <motion.span
        initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
        style={{ display: 'block', fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.8rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.16em', color: labelColor, marginBottom: 16 }}>
        {label}
      </motion.span>
      <motion.h2 className="serif"
        initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}
        style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.2, color: '#f5f5f5', letterSpacing: '-0.02em' }}>
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.5, delay: 0.25 }}
          style={{ marginTop: 20, color: '#9a9a9f', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
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
  const [password, setPassword] = useState('')

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
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
            <input 
              type="submit" 
              className="btn" 
              value={isSignUp ? "Confirm!" : "Let's go!"} 
            />
          </form>

          <div style={{ marginTop: 'auto', paddingTop: '20px', textAlign: 'center', fontSize: '0.75em' }}>
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setName(''); setEmail(''); setPassword(''); }} 
              style={{ background: 'none', border: 'none', color: '#B563FF', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', outline: 'none' }}
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
        background: scrolled ? 'rgba(7,7,10,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.35s',
      }}>
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#a855f7,#ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={15} color="white" />
          </div>
          <span className="serif" style={{ fontWeight: 700, fontSize: '1.25rem', color: '#f5f5f5', letterSpacing: '0.02em' }}>
            Just4You<span className="g-text-gold">.buzz</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hide-sm" style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {navItems.map(n => (
            <a key={n.label} href={n.href}
              style={{ color: '#9a9a9f', fontSize: '0.92rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#c084fc'}
              onMouseLeave={e => e.currentTarget.style.color = '#9a9a9f'}>
              {n.label}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onOpenAuth} className="hide-sm" style={{ background: 'none', border: 'none', color: '#9a9a9f', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, padding: '10px 8px', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fefefe'}
            onMouseLeave={e => e.currentTarget.style.color = '#9a9a9f'}>
            Sign In
          </button>
          <button onClick={onOpenAuth} className="btn btn-main hide-sm" style={{ padding: '12px 24px', fontSize: '0.9rem' }}>
            Create Surprise
          </button>
          <button className="show-sm" onClick={() => setOpen(!open)}
            style={{ background: 'none', border: 'none', color: '#f0f0f0', cursor: 'pointer', padding: 4 }}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(7,7,10,0.98)', borderTop: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div className="wrap" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {navItems.map(n => (
                <a key={n.label} href={n.href} onClick={() => setOpen(false)}
                  style={{ color: '#aaa', fontSize: '1.05rem', textDecoration: 'none', fontWeight: 500 }}>{n.label}</a>
              ))}
              <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => { setOpen(false); onOpenAuth(); }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50px', color: '#f0f0f0', cursor: 'pointer', padding: '12px', fontSize: '1rem', fontWeight: 600 }}>
                  Sign In
                </button>
                <button onClick={() => { setOpen(false); onOpenAuth(); }} className="btn btn-main" style={{ textAlign: 'center', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
                  Create Surprise — ₹299
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
  useEffect(() => {
    const t = setInterval(() => setCurrentOcc(c => (c + 1) % OCCASIONS.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <section style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      padding: '120px 0 80px',
      background: 'radial-gradient(ellipse 85% 65% at 50% -5%, rgba(168,85,247,0.16) 0%, #07070a 65%)',
    }}>
      {/* Ambient Orbs */}
      <div className="orb" style={{ width:650,height:650,top:'-18%',left:'-12%',background:'radial-gradient(circle,#7c3aed,transparent 70%)',opacity:0.12 }} />
      <div className="orb" style={{ width:500,height:500,bottom:'-10%',right:'-10%',background:'radial-gradient(circle,#db2777,transparent 70%)',opacity:0.1 }} />
      
      {/* Grid Pattern overlay */}
      <div style={{ position:'absolute',inset:0,zIndex:0,
        backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)',
        backgroundSize:'80px 80px' }} />

      {/* Floating Particles */}
      {PARTICLES.map(p => (
        <div key={p.id} className="p" style={{ width:p.size,height:p.size,left:`${p.left}%`,
          background:p.color,animationDelay:`${p.delay}s`,animationDuration:`${p.dur}s`,opacity:0.45 }} />
      ))}

      <div style={{ position:'relative',zIndex:10,width:'100%' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign:'center' }}>

          {/* Occasion Switcher Pill */}
          <motion.div
            initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2,duration:0.7 }}
            style={{ display:'inline-flex',alignItems:'center',gap:10,
              background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.22)',
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
                style={{ fontWeight:600,fontSize:'0.9rem',color:'#c084fc',fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'0.02em' }}>
                {OCCASIONS[currentOcc].title}
              </motion.span>
            </AnimatePresence>
            <Sparkles size={14} style={{ color:'#c084fc' }} />
          </motion.div>

          {/* Cinematic Headline */}
          <motion.h1 className="serif"
            initial={{ opacity:0,y:40 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.35,duration:0.9,ease:[0.22,1,0.36,1] }}
            style={{ fontSize:'clamp(2.5rem, 6.5vw, 4.8rem)',fontWeight:900,lineHeight:1.15,letterSpacing:'-0.03em',
              color:'#f5f5f5',marginBottom:24 }}>
            Make Every Celebration <br />
            <span className="g-text">Unforgettable. ✨</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity:0,y:22 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.55,duration:0.7 }}
            style={{ fontSize:'1.15rem',lineHeight:1.8,color:'#9a9a9f',
              maxWidth:620,margin:'0 auto 48px',fontWeight:400,letterSpacing:'0.01em' }}>
            We hand-craft beautiful, personalized surprise websites for your loved ones — filled with photos, music, timelines & heartfelt messages they'll treasure forever.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity:0,y:22 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.7,duration:0.7 }}
            style={{ display:'flex',flexWrap:'wrap',gap:16,justifyContent:'center',alignItems:'center',marginBottom:64 }}>
            <button onClick={onOpenAuth} className="btn btn-main" style={{ fontSize:'1.05rem',padding:'16px 36px' }}>
              Create My Surprise Website <ArrowRight size={18} />
            </button>
            <a href="#how" className="btn btn-ghost" style={{ fontSize:'1.05rem',padding:'15px 32px' }}>
              <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.08)',
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Play size={12} fill="currentColor" />
              </div>
              See How It Works
            </a>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.85,duration:0.6 }}
            style={{ display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'24px 64px', width: '100%',
              paddingTop:36,borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            {[['10,000+','Surprises Delivered'],['98%','Happy Customers'],['24 hrs','Fast Delivery'],['₹299','One-Time Price']].map(([v,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div className="g-text-gold" style={{ fontSize:'1.8rem',fontWeight:800,fontFamily:"'Space Grotesk',sans-serif" }}>{v}</div>
                <div style={{ fontSize:'0.8rem',color:'#7e7e82',marginTop:6,fontWeight:500,letterSpacing:'0.04em',textTransform:'uppercase' }}>{l}</div>
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
    <section id="how" ref={ref} style={{ position:'relative',padding:'120px 0',background:'#07070a',overflow:'hidden' }}>
      <div className="orb" style={{ width:420,height:420,top:'20%',right:'-12%',background:'radial-gradient(circle,#7c3aed,transparent 70%)',opacity:0.07 }} />
      <div className="wrap">
        <SectionHeader label="Step by Step" labelColor="#c084fc"
          title={<>How It Works — <span className="g-text">4 Simple Steps</span></>}
          sub="From idea to a beautiful surprise website in just minutes — no technical skills needed."
          inView={inView} />

        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:28,position:'relative' }}>
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={step.n}
              initial={{ opacity:0, y:40 }} animate={inView?{opacity:1,y:0}:{}}
              transition={{ duration:0.6, delay:i*0.12 }}
              style={{ position:'relative',padding:'36px 28px',borderRadius:20,
                background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)' }}>
              {/* Step number */}
              <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:'0.75rem',fontWeight:800,
                letterSpacing:'0.12em',color:'rgba(192,132,252,0.5)',marginBottom:18 }}>{step.n}</div>
              {/* Icon */}
              <div style={{ fontSize:'2.6rem',marginBottom:20 }}>{step.emoji}</div>
              <h3 style={{ fontSize:'1.1rem',fontWeight:700,color:'#f0f0f0',marginBottom:12 }}>{step.title}</h3>
              <p style={{ fontSize:'0.92rem',color:'#888',lineHeight:1.7 }}>{step.desc}</p>
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
      background:'linear-gradient(180deg,#07070a 0%,#0a0714 50%,#07070a 100%)' }}>
      <div className="orb" style={{ width:450,height:450,bottom:'5%',left:'-10%',background:'radial-gradient(circle,#db2777,transparent 70%)',opacity:0.07 }} />
      <div className="wrap">
        <SectionHeader label="What We Create" labelColor="#f472b6"
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
                background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)' }}>{occ.emoji}</div>
              <div>
                <h3 className="serif" style={{ color:'#f0f0f0',fontSize:'1.15rem',fontWeight:700,marginBottom:10 }}>{occ.title}</h3>
                <p style={{ color:'#8e8e93',fontSize:'0.9rem',lineHeight:1.65 }}>{occ.desc}</p>
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
    <section id="features" ref={ref} style={{ position:'relative',padding:'120px 0',background:'#07070a',overflow:'hidden' }}>
      <div className="orb" style={{ width:400,height:400,top:'30%',left:'-12%',background:'radial-gradient(circle,#7c3aed,transparent 70%)',opacity:0.07 }} />
      <div className="wrap">
        <SectionHeader label="Why Just4You.buzz" labelColor="#34d399"
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
                background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width:46,height:46,borderRadius:12,background:`${f.color}12`,
                display:'flex',alignItems:'center',justifyContent:'center',marginBottom:18 }}>
                <f.icon size={20} style={{ color:f.color }} />
              </div>
              <h3 style={{ fontSize:'1.05rem',fontWeight:700,color:'#efefef',marginBottom:10 }}>{f.title}</h3>
              <p style={{ color:'#86868b',fontSize:'0.88rem',lineHeight:1.65 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
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
      background:'linear-gradient(180deg,#07070a 0%,#0a0714 50%,#07070a 100%)' }}>
      <div ref={ref} className="wrap">
        <SectionHeader label="Visual Themes" labelColor="#fbbf24"
          title={<>Premium Themes — <span className="g-text">Choose the Mood</span></>}
          sub="Every layout option is meticulously formatted to present your story beautifully on all screens."
          inView={inView} />

        <div className="three-col" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24 }}>
          {THEMES.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity:0,scale:0.96 }} animate={inView?{opacity:1,scale:1}:{}}
              transition={{ duration:0.5,delay:i*0.08 }}
              style={{ padding: '30px 24px', borderRadius:20, border:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize:'2.4rem', marginBottom: 6 }}>{t.emoji}</div>
              <div style={{ fontWeight:700,fontSize:'1.1rem',color:'#f0f0f0' }}>{t.name}</div>
              <div style={{ color:'#86868b',fontSize:'0.88rem',lineHeight:1.6 }}>{t.desc}</div>
            </motion.div>
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
      background:'#07070a' }}>
      <div className="orb" style={{ width:380,height:380,top:'10%',right:'-8%',background:'radial-gradient(circle,#db2777,transparent 70%)',opacity:0.07 }} />
      <div className="wrap" style={{ maxWidth:780 }}>
        <SectionHeader label="Real Stories" labelColor="#f472b6"
          title={<>They Cried <span className="g-text">Happy Tears</span></>}
          sub="Over 10,000 surprise websites delivered. Here are some of their stories."
          inView={inView} />

        <motion.div initial={{ opacity:0,y:30 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.7,delay:0.2 }}>
          <AnimatePresence mode="wait">
            <motion.div key={cur}
              initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-16 }}
              transition={{ duration:0.35 }}
              style={{ borderRadius:24,padding:'48px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
                <span style={{ fontSize:'0.8rem',fontWeight:600,padding:'5px 14px',borderRadius:50,background:t.bg,color:t.c,letterSpacing:'0.02em' }}>
                  {t.occ}
                </span>
                <div style={{ display:'flex',gap:4 }}>
                  {Array.from({length:t.rating}).map((_,i) => <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />)}
                </div>
              </div>
              <Quote size={28} style={{ color:t.c,opacity:0.4,marginBottom:18 }} />
              <p style={{ color:'#e4e4e7',fontSize:'1.1rem',lineHeight:1.8,fontStyle:'italic',marginBottom:32 }}>"{t.text}"</p>
              <div style={{ display:'flex',alignItems:'center',gap:16 }}>
                <div style={{ width:46,height:46,borderRadius:'50%',flexShrink:0,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  background:t.bg,color:t.c,fontWeight:700,fontSize:'0.9rem',border:`2px solid ${t.c}30` }}>
                  {t.init}
                </div>
                <div>
                  <div style={{ color:'#f4f4f5',fontWeight:600,fontSize:'0.98rem' }}>{t.name}</div>
                  <div style={{ color:'#71717a',fontSize:'0.8rem',marginTop:2 }}>{t.loc} · {t.occ} Website</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slider Controls */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginTop:32 }}>
            <button onClick={() => setCur(c => (c-1+TESTIMONIALS.length)%TESTIMONIALS.length)}
              style={{ width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',color:'#ccc',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',transition:'color 0.2s,border-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; e.currentTarget.style.color='#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#ccc' }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ display:'flex',gap:8 }}>
              {TESTIMONIALS.map((_,i) => (
                <button key={i} onClick={() => setCur(i)}
                  style={{ width:i===cur?24:8,height:8,borderRadius:4,border:'none',cursor:'pointer',padding:0,
                    transition:'all 0.3s',background:i===cur?'#c084fc':'rgba(255,255,255,0.12)' }} />
              ))}
            </div>
            <button onClick={() => setCur(c => (c+1)%TESTIMONIALS.length)}
              style={{ width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',color:'#ccc',cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',transition:'color 0.2s,border-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; e.currentTarget.style.color='#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#ccc' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── PRICING ───────────────────────────────────────────────────────────────── */
function Pricing({ onOpenAuth }: { onOpenAuth: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const included = [
    'Personalized theme design for your occasion',
    'Up to 8 high-res photos in slideshow',
    'Custom music integration & preset tracks',
    'Personal voice message recording upload',
    'Interactive memory timeline section',
    'Surprise unlock countdown timer',
    'Guest wishes & reaction panel',
    'Mobile-beautiful display on all devices',
    'Password-protected access option',
    'Secure server hosting for 1 full year',
    'WhatsApp / social sharing link',
    '100% money-back satisfaction guarantee',
  ]

  return (
    <section id="pricing" ref={ref} style={{ position:'relative',padding:'120px 0',background:'linear-gradient(180deg,#07070a 0%,#0a0714 60%,#07070a 100%)',overflow:'hidden' }}>
      <div className="orb" style={{ width:500,height:500,top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'radial-gradient(circle,#7c3aed,transparent 70%)',opacity:0.06 }} />
      <div className="wrap" style={{ maxWidth:920 }}>
        <SectionHeader label="Simple Pricing" labelColor="#a855f7"
          title={<>One Price. <span className="g-text">Everything Included.</span></>}
          sub="No complex tiers, no hidden fees. One flat price covers every premium feature."
          inView={inView} />

        {/* Limited offer banner */}
        <motion.div
          initial={{ opacity:0,scale:0.96 }} animate={inView?{opacity:1,scale:1}:{}} transition={{ delay:0.2,duration:0.5 }}
          style={{ textAlign:'center',marginBottom:32 }}>
          <span style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'10px 24px',borderRadius:50,
            background:'rgba(236,72,153,0.08)',border:'1px solid rgba(236,72,153,0.2)',
            fontSize:'0.88rem',fontWeight:600,color:'#f472b6',letterSpacing:'0.01em' }}>
            🔥 50% OFF — Limited to the next 50 orders only!
          </span>
        </motion.div>

        {/* Pricing card */}
        <motion.div
          initial={{ opacity:0,y:48 }} animate={inView?{opacity:1,y:0}:{}}
          transition={{ duration:0.8,delay:0.25,ease:[0.22,1,0.36,1] }}
          className="gb"
          style={{ background:'linear-gradient(135deg,rgba(168,85,247,0.06),rgba(236,72,153,0.04))',
            boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
          <div style={{ height:4,background:'linear-gradient(90deg,#a855f7,#ec4899,#fb923c)',borderRadius:'22px 22px 0 0' }} />
          <div style={{ padding:'48px 56px' }}>
            <div className="two-col" style={{ display:'grid',gridTemplateColumns:'1fr 1.2fr',gap:52,alignItems:'center' }}>

              {/* Price Details */}
              <div style={{ minWidth:220 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                  <Sparkles size={14} style={{ color:'#c084fc' }} />
                  <span style={{ fontSize:'0.75rem',fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'#c084fc' }}>All-Inclusive Pass</span>
                </div>
                
                <div style={{ display:'flex',alignItems:'flex-end',gap:12,margin:'16px 0 8px' }}>
                  <span className="g-text-gold" style={{ fontSize:'4.2rem',fontWeight:900,lineHeight:1,fontFamily:"'Space Grotesk',sans-serif" }}>₹299</span>
                  <div style={{ marginBottom:10 }}>
                    <span style={{ fontSize:'1.15rem',textDecoration:'line-through',color:'#4a4a4f' }}>₹599</span>
                    <div style={{ fontSize:'0.7rem',fontWeight:800,padding:'3px 8px',borderRadius:50,
                      background:'rgba(236,72,153,0.15)',color:'#f472b6',marginTop:6,textAlign:'center',letterSpacing:'0.02em' }}>50% OFF</div>
                  </div>
                </div>
                <p style={{ color:'#f472b6',fontSize:'0.85rem',fontWeight:600,marginBottom:6 }}>⏳ Limited offer price</p>
                <p style={{ color:'#52525b',fontSize:'0.8rem',marginBottom:32 }}>One-time payment · Lifetime memories</p>

                <button onClick={onOpenAuth} className="btn btn-main" style={{ width:'100%',justifyContent:'center',fontSize:'1.05rem',padding:'16px' }}>
                  Create Now — ₹299 <ArrowRight size={16} />
                </button>

                <div style={{ marginTop:24,display:'flex',flexDirection:'column',gap:9 }}>
                  {['🔒 Secure payments via Razorpay','📞 WhatsApp Support 24/7','✅ 100% satisfaction guarantee'].map(b => (
                    <span key={b} style={{ color:'#6b6b6f',fontSize:'0.82rem',fontWeight:500 }}>{b}</span>
                  ))}
                </div>
              </div>

              {/* Inclusions */}
              <div style={{ borderLeft:'1px solid rgba(255,255,255,0.06)',paddingLeft:48 }}>
                <p style={{ color:'#a0a0a5',fontSize:'0.9rem',fontWeight:600,marginBottom:20 }}>
                  Everything included in your ₹299 website:
                </p>
                <div style={{ display:'grid',gridTemplateColumns:'1fr',gap:'14px' }}>
                  {included.map(feat => (
                    <div key={feat} style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
                      <div style={{ width:20,height:20,borderRadius:'50%',background:'rgba(168,85,247,0.12)',
                        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1 }}>
                        <Check size={11} style={{ color:'#c084fc' }} />
                      </div>
                      <span style={{ color:'#8e8e93',fontSize:'0.88rem',lineHeight:1.5 }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── FINAL CTA ─────────────────────────────────────────────────────────────── */
function FinalCTA({ onOpenAuth }: { onOpenAuth: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section ref={ref} style={{ position:'relative',padding:'120px 0',overflow:'hidden',background:'#07070a' }}>
      <div className="orb" style={{ width:550,height:550,top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'radial-gradient(circle,#7c3aed,transparent 70%)',opacity:0.08 }} />
      <div className="wrap" style={{ maxWidth:860,textAlign:'center' }}>
        <motion.div
          initial={{ opacity:0,y:48 }} animate={inView?{opacity:1,y:0}:{}}
          transition={{ duration:1,ease:[0.22,1,0.36,1] }}
          className="gb"
          style={{ background:'linear-gradient(135deg,#0d0d12,#120f20)' }}>
          <div style={{ padding:'64px 56px',borderRadius:22 }}>
            <div className="float" style={{ fontSize:'3.6rem',marginBottom:24 }}>✨</div>
            <h2 className="serif" style={{ fontSize:'clamp(2.1rem,4.5vw,3rem)',fontWeight:700,color:'#f0f0f0',lineHeight:1.2,marginBottom:12 }}>
              Your Story Deserves More
            </h2>
            <h2 className="serif g-text" style={{ fontSize:'clamp(2.1rem,4.5vw,3rem)',fontWeight:700,lineHeight:1.2,marginBottom:24 }}>
              Than a Disposable Card.
            </h2>
            <p style={{ color:'#8e8e93',fontSize:'1.08rem',lineHeight:1.75,maxWidth:500,margin:'0 auto 40px' }}>
              Create a magical digital surprise page that your loved ones will open, cherish, and remember forever — starting at just ₹299.
            </p>
            <div style={{ display:'flex',flexWrap:'wrap',gap:16,justifyContent:'center' }}>
              <button onClick={onOpenAuth} className="btn btn-main" style={{ fontSize:'1.05rem',padding:'16px 36px' }}>
                Create Surprise Website <ArrowRight size={18} />
              </button>
              <a href="https://wa.me/919999999999?text=Hi!%20I%20want%20to%20create%20a%20surprise%20website."
                target="_blank" rel="noopener noreferrer"
                className="btn btn-ghost" style={{ fontSize:'1.05rem',padding:'15px 32px' }}>
                <MessageCircle size={18} style={{ color:'#25D366' }} />
                WhatsApp Us
              </a>
            </div>
            <p style={{ marginTop:36,color:'#4b4b4f',fontSize:'0.84rem',fontWeight:500 }}>
              🎉 10,000+ surprises delivered &nbsp;·&nbsp; ⚡ Ready in 24 hrs &nbsp;·&nbsp; 💛 100% happy customers
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
    { Icon: X,      label: 'Twitter/X', color: '#c084fc' },
    { Icon: Mail,   label: 'Email',     color: '#fbbf24' },
  ]
  return (
    <footer style={{ background:'#050507',borderTop:'1px solid rgba(255,255,255,0.05)',padding:'64px 0 32px' }}>
      <div className="wrap">
        <div className="two-col" style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:64,marginBottom:64 }}>
          {/* Brand details */}
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
              <div style={{ width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#a855f7,#ec4899)',
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Sparkles size={14} color="white" />
              </div>
              <span className="serif" style={{ fontWeight:700,fontSize:'1.15rem',color:'#f0f0f0' }}>
                Just4You<span className="g-text-gold">.buzz</span>
              </span>
            </div>
            <p style={{ color:'#6e6e73',fontSize:'0.88rem',lineHeight:1.7,maxWidth:300,marginBottom:24 }}>
              Turning Special Moments Into Beautiful Digital Memories. Premium personalized surprise websites since 2023.
            </p>
            <div style={{ display:'flex',gap:12 }}>
              {socials.map(({Icon,label,color}) => (
                <a key={label} href="#" title={label}
                  style={{ width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.04)',
                    border:'1px solid rgba(255,255,255,0.08)',color:'#666',display:'flex',alignItems:'center',
                    justifyContent:'center',textDecoration:'none',transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=color; e.currentTarget.style.color=color }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#666' }}>
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Occasions list */}
          <div>
            <h4 style={{ color:'#e4e4e7',fontSize:'0.92rem',fontWeight:700,marginBottom:20 }}>Occasions</h4>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {['Birthday','Anniversary','Proposal','Kids Birthday','Graduation','Custom'].map(item => (
                <a key={item} href="#occasions"
                  style={{ color:'#6b6b6f',textDecoration:'none',fontSize:'0.88rem',transition:'color 0.2s',fontWeight:500 }}
                  onMouseEnter={e => e.currentTarget.style.color='#c084fc'}
                  onMouseLeave={e => e.currentTarget.style.color='#6b6b6f'}>
                  {item} Website
                </a>
              ))}
            </div>
          </div>

          {/* Company links */}
          <div>
            <h4 style={{ color:'#e4e4e7',fontSize:'0.92rem',fontWeight:700,marginBottom:20 }}>Links</h4>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {['How It Works','Pricing','Testimonials','Privacy Policy','Terms of Service','Contact Us'].map(item => (
                <button key={item} onClick={onOpenAuth}
                  style={{ background: 'none', border: 'none', padding: 0, textDecoration:'none', textAlign: 'left', cursor: 'pointer', color:'#6b6b6f',fontSize:'0.88rem',transition:'color 0.2s',fontWeight:500 }}
                  onMouseEnter={e => e.currentTarget.style.color='#c084fc'}
                  onMouseLeave={e => e.currentTarget.style.color='#6b6b6f'}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',
          paddingTop:24,borderTop:'1px solid rgba(255,255,255,0.05)',flexWrap:'wrap',gap:16 }}>
          <p style={{ color:'#48484f',fontSize:'0.82rem',fontWeight:500 }}>© 2026 Just4You.buzz · All rights reserved</p>
          <p style={{ color:'#48484f',fontSize:'0.82rem',display:'flex',alignItems:'center',gap:5,fontWeight:500 }}>
            Made with <Heart size={11} style={{ color:'#ec4899' }} fill="#ec4899" /> for every celebration
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ─── ROOT APP ───────────────────────────────────────────────────────────────── */
export default function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  const handleOpenAuth = () => setIsAuthOpen(true)
  const handleCloseAuth = () => setIsAuthOpen(false)

  return (
    <div style={{ background: '#07070a', minHeight: '100vh' }}>
      <Navbar onOpenAuth={handleOpenAuth} />
      <Hero onOpenAuth={handleOpenAuth} />
      <HowItWorks onOpenAuth={handleOpenAuth} />
      <Occasions onOpenAuth={handleOpenAuth} />
      <ThemeShowcase />
      <FeaturesGrid />
      <Testimonials />
      <Pricing onOpenAuth={handleOpenAuth} />
      <FinalCTA onOpenAuth={handleOpenAuth} />
      <Footer onOpenAuth={handleOpenAuth} />

      {/* Login & Signup Overlay Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal isOpen={isAuthOpen} onClose={handleCloseAuth} />
        )}
      </AnimatePresence>
    </div>
  )
}
