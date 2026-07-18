import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Play } from 'lucide-react'

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 2,
  left: Math.random() * 100,
  delay: Math.random() * 10,
  duration: Math.random() * 8 + 7,
  color: ['#d69e5f','#e8758a','#9b6dff','#4ecdc4'][Math.floor(Math.random() * 4)],
}))

const occasions = ['Birthday Surprises','Proposals','Anniversaries','Graduations','Kids Birthdays','Custom Events']

export default function Hero() {
  return (
    <section id="home" style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(155,109,255,0.13) 0%, #0c0c0c 65%)',
    }}>
      {/* Orbs */}
      <div className="orb orb-gold" style={{ width:700,height:700,top:'-15%',left:'-12%',opacity:0.09 }} />
      <div className="orb orb-purple" style={{ width:600,height:600,bottom:'-10%',right:'-10%',opacity:0.09 }} />
      <div className="orb orb-rose" style={{ width:280,height:280,top:'40%',right:'12%',opacity:0.06 }} />

      {/* Grid pattern */}
      <div style={{
        position:'absolute',inset:0,zIndex:0,
        backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
        backgroundSize:'70px 70px',
      }} />

      {/* Particles */}
      {PARTICLES.map(p => (
        <div key={p.id} className="particle" style={{
          width:p.size, height:p.size, left:`${p.left}%`,
          background:p.color, animationDelay:`${p.delay}s`, animationDuration:`${p.duration}s`, opacity:0.45,
        }} />
      ))}

      {/* Main content */}
      <div style={{ position:'relative',zIndex:10,width:'100%' }}>
        <div className="container-xl" style={{ textAlign:'center' }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.2, duration:0.7 }}
            style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(255,255,255,0.04)', backdropFilter:'blur(16px)',
              border:'1px solid rgba(214,158,95,0.22)', borderRadius:50,
              padding:'10px 22px', marginBottom:32,
            }}>
            <Sparkles size={13} style={{ color:'#d69e5f' }} />
            <span className="font-grotesk" style={{ color:'#d69e5f', fontSize:'0.85rem', fontWeight:600 }}>
              Premium Personalized Surprise Websites
            </span>
            <Sparkles size={13} style={{ color:'#d69e5f' }} />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.35, duration:0.9, ease:[0.22,1,0.36,1] }}
            className="section-title" style={{ marginBottom:8 }}>
            Make Every Celebration
          </motion.h1>

          <motion.h1
            initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.48, duration:0.9, ease:[0.22,1,0.36,1] }}
            className="section-title gradient-text-gold" style={{ marginBottom:28 }}>
            Unforgettable. ✨
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.6, duration:0.7 }}
            className="font-grotesk"
            style={{ color:'#858585', fontSize:'1.1rem', lineHeight:1.8, maxWidth:580, margin:'0 auto 24px' }}>
            We create beautiful, personalized surprise websites for your loved ones — filled with
            photos, videos, music &amp; heartfelt messages they'll treasure forever.
          </motion.p>

          {/* Occasion pills */}
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            transition={{ delay:0.75, duration:0.6 }}
            style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8, marginBottom:40 }}>
            {occasions.map(occ => (
              <span key={occ} className="font-grotesk" style={{
                fontSize:'0.78rem', fontWeight:500, padding:'6px 14px', borderRadius:50,
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#aaa',
              }}>{occ}</span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.88, duration:0.7 }}
            style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:14 }}>
            <motion.button className="btn-primary"
              whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}>
              Create My Surprise Website <ArrowRight size={17} />
            </motion.button>
            <motion.button className="btn-secondary"
              whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}>
              <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Play size={12} fill="currentColor" />
              </div>
              View Live Examples
            </motion.button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:1.1, duration:0.6 }}
            style={{
              display:'flex', flexWrap:'wrap', justifyContent:'center', gap:48,
              marginTop:60, paddingTop:32, borderTop:'1px solid rgba(255,255,255,0.06)',
            }}>
            {[['6','Stunning Themes'],['24 hrs','Fast Delivery'],['1 Year','Hosting Included'],['₹299','All-Inclusive']].map(([v,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div className="gradient-text-gold font-grotesk" style={{ fontSize:'1.6rem', fontWeight:700 }}>{v}</div>
                <div className="font-grotesk" style={{ fontSize:'0.75rem', color:'#555', marginTop:4 }}>{l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{ position:'absolute',bottom:0,left:0,right:0,height:80,background:'linear-gradient(to bottom,transparent,#0c0c0c)',zIndex:10 }} />

      {/* Scroll indicator */}
      <motion.div
        style={{ position:'absolute',bottom:28,left:'50%',translateX:'-50%',zIndex:10 }}
        animate={{ y:[0,8,0] }} transition={{ duration:2,repeat:Infinity }}>
        <div style={{ width:24,height:40,borderRadius:12,border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:7 }}>
          <div style={{ width:5,height:10,borderRadius:3,background:'linear-gradient(to bottom,#d69e5f,transparent)' }} />
        </div>
      </motion.div>
    </section>
  )
}
