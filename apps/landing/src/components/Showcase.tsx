import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Music, Image, Video, Heart, Clock, MessageCircle, Play, Pause, ChevronRight, Star, Lock } from 'lucide-react'

const features = [
  { icon:Heart,          label:'Personalized Greeting & Love Note', color:'#e8758a' },
  { icon:Music,          label:'Custom Background Music Player',    color:'#9b6dff' },
  { icon:Clock,          label:'Interactive Memory Timeline',       color:'#d69e5f' },
  { icon:Image,          label:'Beautiful Photo Gallery',           color:'#4ecdc4' },
  { icon:Video,          label:'Video Messages Integration',        color:'#e8758a' },
  { icon:MessageCircle,  label:'Guest Wishes & Reactions',          color:'#9b6dff' },
  { icon:Lock,           label:'Password-Protected Reveal',         color:'#d69e5f' },
]

export default function Showcase() {
  const [playing, setPlaying] = useState(false)
  const [active, setActive]   = useState(0)
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once:true, margin:'-80px' })

  return (
    <section id="gallery" style={{
      position:'relative', padding:'96px 0', overflow:'hidden',
      background:'linear-gradient(180deg,#0c0c0c 0%,#0e0a16 50%,#0c0c0c 100%)',
    }}>
      <div className="orb orb-gold"   style={{ width:450,height:450,top:'0%',left:'-14%',opacity:0.06 }} />
      <div className="orb orb-teal"   style={{ width:320,height:320,bottom:'10%',right:'-8%',opacity:0.06 }} />

      <div ref={ref} className="container-xl">
        {/* Section heading — centered */}
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <motion.span className="section-label" style={{ color:'#9b6dff' }}
            initial={{ opacity:0,y:16 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.5 }}>
            Interactive Showcase
          </motion.span>
          <motion.h2 className="section-title"
            initial={{ opacity:0,y:24 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.7,delay:0.1 }}>
            See What We Build <span className="gradient-text">For You</span>
          </motion.h2>
          <motion.p className="section-subtitle" style={{ maxWidth:520,margin:'14px auto 0' }}
            initial={{ opacity:0 }} animate={inView?{opacity:1}:{}} transition={{ duration:0.5,delay:0.2 }}>
            Every website is packed with interactive features that turn your words and memories into something unforgettable.
          </motion.p>
        </div>

        {/* Two-col layout */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'start' }}>

          {/* Left — browser mockup */}
          <motion.div
            initial={{ opacity:0, x:-40 }} animate={inView?{opacity:1,x:0}:{}}
            transition={{ duration:0.9, ease:[0.22,1,0.36,1] }}>
            <div style={{
              borderRadius:18, overflow:'hidden',
              border:'1px solid rgba(255,255,255,0.1)', background:'#141414',
              boxShadow:'0 32px 80px rgba(0,0,0,0.5)',
            }}>
              {/* Browser chrome */}
              <div style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 16px',background:'#1c1c1c',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex',gap:6 }}>
                  {['#ff5f57','#febc2e','#28c840'].map(c=><div key={c} style={{ width:11,height:11,borderRadius:'50%',background:c }} />)}
                </div>
                <div className="font-grotesk" style={{ flex:1,margin:'0 12px',padding:'4px 12px',borderRadius:6,background:'rgba(255,255,255,0.05)',color:'#555',fontSize:'0.75rem',textAlign:'center' }}>
                  just4you.buzz/surprise/sarah-birthday
                </div>
              </div>

              {/* Page content */}
              <div style={{ padding:20, background:'#0f0f14', display:'flex', flexDirection:'column', gap:14 }}>
                {/* Greeting */}
                <div style={{ borderRadius:14,padding:'18px 20px',textAlign:'center',background:'linear-gradient(135deg,rgba(214,158,95,0.12),rgba(232,117,138,0.08))',border:'1px solid rgba(214,158,95,0.2)' }}>
                  <div style={{ fontSize:'2rem',marginBottom:6 }}>🎂</div>
                  <div className="font-display" style={{ color:'#f5f5f5',fontSize:'1.15rem',fontWeight:700,marginBottom:5 }}>Happy 26th Birthday, Sarah!</div>
                  <div className="font-grotesk" style={{ color:'#888',fontSize:'0.82rem' }}>"You make every single day brighter. Here's to you! 🥂"</div>
                  <div style={{ display:'flex',justifyContent:'center',gap:3,marginTop:8 }}>
                    {[1,2,3,4,5].map(s=><Star key={s} size={11} fill="#d69e5f" color="#d69e5f" />)}
                  </div>
                </div>

                {/* Music player */}
                <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,background:'rgba(155,109,255,0.1)',border:'1px solid rgba(155,109,255,0.2)' }}>
                  <button onClick={()=>setPlaying(!playing)} style={{ width:34,height:34,borderRadius:'50%',background:'#9b6dff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    {playing ? <Pause size={12} color="white" /> : <Play size={12} color="white" fill="white" />}
                  </button>
                  <div style={{ flex:1 }}>
                    <div className="font-grotesk" style={{ color:'#ccc',fontSize:'0.82rem',fontWeight:600,marginBottom:5 }}>Perfect — Ed Sheeran</div>
                    <div style={{ height:4,borderRadius:3,background:'rgba(255,255,255,0.1)' }}>
                      <div style={{ width:'45%',height:'100%',borderRadius:3,background:'linear-gradient(90deg,#9b6dff,#e8758a)' }} />
                    </div>
                  </div>
                  <span className="font-grotesk" style={{ color:'#555',fontSize:'0.72rem' }}>2:18</span>
                </div>

                {/* Timeline */}
                <div style={{ borderRadius:12,padding:'14px 16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div className="section-label" style={{ color:'#d69e5f',marginBottom:10,fontSize:'0.7rem' }}>Memory Timeline</div>
                  {[['2019','The day we first met 💫'],['2021','Our first road trip 🚗'],['2024','Best friends forever ❤️']].map(([yr,txt],i)=>(
                    <div key={i} style={{ display:'flex',gap:12,marginBottom:i<2?10:0 }}>
                      <span className="font-grotesk" style={{ color:'#d69e5f',fontSize:'0.78rem',fontWeight:700,flexShrink:0,minWidth:32 }}>{yr}</span>
                      <span className="font-grotesk" style={{ color:'#777',fontSize:'0.78rem' }}>{txt}</span>
                    </div>
                  ))}
                </div>

                {/* Countdown */}
                <div style={{ display:'flex',justifyContent:'center',gap:28,padding:'12px',borderRadius:12,background:'rgba(78,205,196,0.08)',border:'1px solid rgba(78,205,196,0.2)' }}>
                  {[['02','hrs'],['14','min'],['36','sec']].map(([v,l])=>(
                    <div key={l} style={{ textAlign:'center' }}>
                      <div className="font-grotesk" style={{ color:'#4ecdc4',fontSize:'1.4rem',fontWeight:700 }}>{v}</div>
                      <div className="font-grotesk" style={{ color:'#555',fontSize:'0.7rem' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Float badge */}
            <motion.div className="float glass-gold" style={{ display:'inline-block',borderRadius:16,padding:'12px 20px',textAlign:'center',marginTop:16,marginLeft:16 }}>
              <div className="gradient-text-gold font-grotesk" style={{ fontSize:'1.4rem',fontWeight:700 }}>24 hrs</div>
              <div className="font-grotesk" style={{ color:'#a0a0a0',fontSize:'0.72rem',marginTop:2 }}>Ready for them</div>
            </motion.div>
          </motion.div>

          {/* Right — feature list */}
          <motion.div
            initial={{ opacity:0, x:40 }} animate={inView?{opacity:1,x:0}:{}}
            transition={{ duration:0.9, ease:[0.22,1,0.36,1], delay:0.15 }}>
            <h3 className="font-display" style={{ color:'#f5f5f5',fontSize:'clamp(1.4rem,2.5vw,2rem)',fontWeight:700,lineHeight:1.25,marginBottom:10 }}>
              Everything Your Loved One <span className="gradient-text">Deserves</span>
            </h3>
            <p className="font-grotesk" style={{ color:'#777',fontSize:'0.9rem',lineHeight:1.7,marginBottom:28 }}>
              Each website is hand-crafted with a complete suite of interactive features — turning memories into a moment they'll never forget.
            </p>

            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {features.map((f,i)=>(
                <motion.div key={f.label}
                  initial={{ opacity:0,x:14 }} animate={inView?{opacity:1,x:0}:{}} transition={{ delay:0.25+i*0.07,duration:0.45 }}
                  onClick={()=>setActive(i)}
                  style={{
                    display:'flex',alignItems:'center',gap:14,padding:'13px 16px',borderRadius:12,cursor:'pointer',
                    transition:'all 0.25s',
                    background: active===i ? `${f.color}0f` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active===i ? f.color+'30' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                  <div style={{ width:36,height:36,borderRadius:10,background:`${f.color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <f.icon size={15} style={{ color:f.color }} />
                  </div>
                  <span className="font-grotesk" style={{ color:'#d0d0d0',fontSize:'0.88rem',fontWeight:500,flex:1 }}>{f.label}</span>
                  <ChevronRight size={13} style={{ color: active===i ? f.color : '#444',flexShrink:0 }} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
