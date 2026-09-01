import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check, Sparkles, ArrowRight } from 'lucide-react'
import { BASE_PRICE_INR } from '../marketing-config'

const features = [
  'Fully personalized design for your occasion',
  'Up to 100 photos + video messages',
  'Custom background music integration',
  'Memory timeline & photo gallery',
  'Surprise reveal with countdown timer',
  'Guest wishes & reactions section',
  'Password-protected reveal experience',
  'Mobile-friendly on all devices',
  'Shareable link via WhatsApp / Instagram',
  'Secure hosting for 1 full year',
  'Priority delivery within 24 hours',
  '100% satisfaction guarantee',
]

export default function Pricing() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once:true, margin:'-80px' })

  return (
    <section id="pricing" style={{ position:'relative', padding:'96px 0', overflow:'hidden', background:'#0c0c0c' }}>
      <div className="orb orb-gold"   style={{ width:500,height:500,top:'-10%',right:'-15%',opacity:0.07 }} />
      <div className="orb orb-purple" style={{ width:400,height:400,bottom:'-5%',left:'-12%',opacity:0.06 }} />

      <div ref={ref} className="container-xl" style={{ maxWidth:900 }}>
        {/* Heading */}
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <motion.span className="section-label" style={{ color:'#9b6dff' }}
            initial={{ opacity:0,y:16 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.5 }}>
            Simple Pricing
          </motion.span>
          <motion.h2 className="section-title"
            initial={{ opacity:0,y:24 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.7,delay:0.1 }}>
            One Price. Everything Included.
          </motion.h2>
          <motion.p className="section-subtitle" style={{ maxWidth:460,margin:'14px auto 0' }}
            initial={{ opacity:0 }} animate={inView?{opacity:1}:{}} transition={{ duration:0.5,delay:0.2 }}>
            No plans, no confusion. One flat price covers absolutely everything.
          </motion.p>
          {/* Limited banner */}
          <motion.div
            initial={{ opacity:0,scale:0.9 }} animate={inView?{opacity:1,scale:1}:{}} transition={{ duration:0.5,delay:0.3 }}
            className="font-grotesk"
            style={{ display:'inline-flex',alignItems:'center',gap:8,marginTop:20,padding:'10px 22px',borderRadius:50,fontSize:'0.85rem',fontWeight:600,background:'rgba(232,117,138,0.12)',border:'1px solid rgba(232,117,138,0.28)',color:'#e8758a' }}>
            🔥 Limited Offer — 50% OFF for next 50 orders only!
          </motion.div>
        </div>

        {/* Single big card */}
        <motion.div
          initial={{ opacity:0,y:50 }} animate={inView?{opacity:1,y:0}:{}}
          transition={{ duration:0.8,delay:0.25,ease:[0.22,1,0.36,1] }}
          style={{ borderRadius:24,overflow:'hidden',border:'1px solid rgba(214,158,95,0.22)',background:'linear-gradient(135deg,rgba(214,158,95,0.08),rgba(232,117,138,0.05),rgba(155,109,255,0.06))',boxShadow:'0 32px 80px rgba(0,0,0,0.4)' }}>
          {/* Colour strip */}
          <div style={{ height:4,background:'linear-gradient(90deg,#d69e5f,#e8758a,#9b6dff)' }} />

          <div style={{ padding:'40px 48px' }}>
            <div style={{ display:'grid',gridTemplateColumns:'auto 1fr',gap:48,alignItems:'start' }}>

              {/* Left — price */}
              <div style={{ minWidth:220 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                  <Sparkles size={15} style={{ color:'#d69e5f' }} />
                  <span className="section-label" style={{ color:'#d69e5f',marginBottom:0 }}>All-Inclusive</span>
                </div>

                <div style={{ display:'flex',alignItems:'flex-end',gap:12,margin:'14px 0 4px' }}>
                  <span className="gradient-text-gold font-grotesk" style={{ fontSize:'3.6rem',fontWeight:800,lineHeight:1 }}>₹{BASE_PRICE_INR}</span>
                  <div style={{ marginBottom:6 }}>
                    <span className="font-grotesk" style={{ fontSize:'1.1rem',textDecoration:'line-through',color:'#555' }}>₹599</span>
                    <div className="font-grotesk" style={{ fontSize:'0.72rem',fontWeight:700,padding:'3px 8px',borderRadius:50,background:'rgba(232,117,138,0.2)',color:'#e8758a',marginTop:4,textAlign:'center' }}>
                      50% OFF
                    </div>
                  </div>
                </div>

                <p className="font-grotesk" style={{ color:'#e8758a',fontSize:'0.82rem',marginBottom:4 }}>
                  ⏳ For next 50 orders only
                </p>
                <p className="font-grotesk" style={{ color:'#555',fontSize:'0.78rem',marginBottom:28 }}>
                  One-time payment · No hidden fees
                </p>

                <button className="btn-primary" style={{ width:'100%',justifyContent:'center' }}>
                  Create My Surprise — ₹{BASE_PRICE_INR} <ArrowRight size={15} />
                </button>
              </div>

              {/* Divider */}
              <div style={{ borderLeft:'1px solid rgba(255,255,255,0.07)', paddingLeft:48 }}>
                <p className="font-grotesk" style={{ color:'#888',fontSize:'0.82rem',fontWeight:600,marginBottom:18 }}>
                  Everything included in your ₹{BASE_PRICE_INR}:
                </p>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 24px' }}>
                  {features.map(feat=>(
                    <div key={feat} style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
                      <div style={{ width:20,height:20,borderRadius:'50%',background:'rgba(214,158,95,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1 }}>
                        <Check size={11} style={{ color:'#d69e5f' }} />
                      </div>
                      <span className="font-grotesk" style={{ color:'#999',fontSize:'0.84rem',lineHeight:1.5 }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust row */}
        <motion.p
          initial={{ opacity:0 }} animate={inView?{opacity:1}:{}} transition={{ delay:0.7,duration:0.5 }}
          className="font-grotesk"
          style={{ textAlign:'center',color:'#4a4a4a',fontSize:'0.82rem',marginTop:24 }}>
          🔒 Secure payments via Razorpay &nbsp;·&nbsp; 📞 WhatsApp Support &nbsp;·&nbsp; ✅ 100% Satisfaction Guarantee
        </motion.p>
      </div>
    </section>
  )
}
