import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Palette, Smartphone, Music2, Images, Gift, Zap, Shield, Share2 } from 'lucide-react'

const features = [
  { icon:Palette,    title:'Fully Personalized',         desc:'Every website is uniquely crafted for your occasion, story, and loved one.',             color:'#d69e5f' },
  { icon:Smartphone, title:'Mobile Friendly',            desc:'Looks stunning on any screen — phones, tablets, desktops. Perfect for sharing.',          color:'#e8758a' },
  { icon:Music2,     title:'Custom Music',               desc:'Add your special song, playlist, or voice recording to make it truly emotional.',          color:'#9b6dff' },
  { icon:Images,     title:'Photo & Video Galleries',    desc:'Upload photos and videos organized in beautiful, cinematic galleries.',                    color:'#4ecdc4' },
  { icon:Gift,       title:'Surprise Reveal',            desc:'Build suspense with password-protected reveals, countdowns & animated openings.',          color:'#d69e5f' },
  { icon:Zap,        title:'Fast Delivery',              desc:'Your personalized website is ready within 24 hours. Rush delivery in 6 hours.',            color:'#e8758a' },
  { icon:Shield,     title:'Secure Hosting',             desc:'Enterprise-grade security. Your memories hosted safely for 1 full year.',                  color:'#9b6dff' },
  { icon:Share2,     title:'Shareable Link',             desc:'One beautiful link to share via WhatsApp, email, Instagram, or any platform.',            color:'#4ecdc4' },
]

export default function Features() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once:true, margin:'-80px' })

  return (
    <section id="features" style={{ position:'relative', padding:'96px 0', overflow:'hidden', background:'#0c0c0c' }}>
      <div className="orb orb-gold"   style={{ width:450,height:450,top:'30%',left:'-18%',opacity:0.06 }} />
      <div className="orb orb-purple" style={{ width:380,height:380,bottom:'10%',right:'-10%',opacity:0.06 }} />

      <div ref={ref} className="container-xl">
        {/* Heading */}
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <motion.span className="section-label" style={{ color:'#4ecdc4' }}
            initial={{ opacity:0,y:16 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.5 }}>
            Why Choose Us
          </motion.span>
          <motion.h2 className="section-title"
            initial={{ opacity:0,y:24 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.7,delay:0.1 }}>
            Why Just4You<span className="gradient-text-gold">.buzz</span>?
          </motion.h2>
          <motion.p className="section-subtitle" style={{ maxWidth:480,margin:'14px auto 0' }}
            initial={{ opacity:0 }} animate={inView?{opacity:1}:{}} transition={{ duration:0.5,delay:0.2 }}>
            We don't just build websites — we craft experiences that move people to tears of joy.
          </motion.p>
        </div>

        {/* 4-col grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:18 }}>
          {features.map((f,i)=>(
            <motion.div key={f.title}
              initial={{ opacity:0,y:40 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.6,delay:i*0.07 }}
              whileHover={{ y:-5,transition:{duration:0.25} }}
              style={{ padding:'22px 20px', borderRadius:16, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width:44,height:44,borderRadius:12,background:`${f.color}14`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14 }}>
                <f.icon size={20} style={{ color:f.color }} />
              </div>
              <h3 className="font-grotesk" style={{ color:'#efefef',fontSize:'0.95rem',fontWeight:600,marginBottom:8 }}>{f.title}</h3>
              <p className="font-grotesk" style={{ color:'#666',fontSize:'0.84rem',lineHeight:1.65 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
