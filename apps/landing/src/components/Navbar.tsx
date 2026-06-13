import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sparkles } from 'lucide-react'

const navItems = ['Home', 'Occasions', 'Gallery', 'Pricing', 'Testimonials', 'Contact']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'all 0.4s',
        background: scrolled ? 'rgba(12,12,12,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
      }}
    >
      <div
        className="container-xl"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}
      >
        {/* Logo */}
        <motion.a href="#" whileHover={{ scale: 1.02 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#d69e5f,#e8758a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={16} color="white" />
          </div>
          <span className="font-display" style={{ fontWeight: 700, fontSize: '1.2rem', color: '#f5f5f5' }}>
            Just4You<span className="gradient-text-gold">.buzz</span>
          </span>
        </motion.a>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 36 }}
          className="hidden-mobile">
          {navItems.map((item) => (
            <motion.a key={item} href={`#${item.toLowerCase()}`}
              style={{ color: '#909090', textDecoration: 'none', fontSize: '0.9rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500 }}
              whileHover={{ color: '#d69e5f' }}>
              {item}
            </motion.a>
          ))}
        </nav>

        {/* CTA + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-primary hidden-mobile"
            style={{ padding: '10px 22px', fontSize: '0.9rem' }}>
            Create My Surprise
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="show-mobile"
            style={{ background: 'none', border: 'none', color: '#f5f5f5', cursor: 'pointer', padding: 4 }}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: 'rgba(12,12,12,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div className="container-xl" style={{ paddingTop: 16, paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {navItems.map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`}
                  style={{ color: '#909090', textDecoration: 'none', fontSize: '1rem', fontFamily: "'Space Grotesk',sans-serif" }}
                  onClick={() => setOpen(false)}>{item}</a>
              ))}
              <button className="btn-primary" style={{ marginTop: 8 }}>Create My Surprise</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
