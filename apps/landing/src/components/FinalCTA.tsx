import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, MessageCircle } from 'lucide-react'

export default function FinalCTA() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once:true, margin:'-80px' })

  return (
    <section id="contact" style={{
      position:'relative', padding:'96px 0', overflow:'hidden',
      background:'linear-gradient(180deg,#0c0c0c 0%,#0e0a16 60%,#0c0c0c 100%)',
    }}>
      <div className="orb orb-gold"   style={{ width:600,height:600,top:'50%',left:'50%',transform:'translate(-50%,-50%)',opacity:0.06 }} />
      <div className="orb orb-purple" style={{ width:350,height:350,top:0,right:'8%',opacity:0.06 }} />
      <div className="orb orb-rose"   style={{ width:280,height:280,bottom:0,left:'8%',opacity:0.06 }} />

      <div ref={ref} className="container-xl" style={{ maxWidth:860 }}>
        <motion.div
          initial={{ opacity:0,y:50 }} animate={inView?{opacity:1,y:0}:{}}
          transition={{ duration:1,ease:[0.22,1,0.36,1] }}
          className="grad-border">
          <div style={{ borderRadius:20,textAlign:'center',padding:'64px 56px',background:'linear-gradient(135deg,#0f0f0f,#12101a)' }}>

            {/* Badge */}
            <motion.div
              initial={{ opacity:0,scale:0.8 }} animate={inView?{opacity:1,scale:1}:{}} transition={{ delay:0.2,duration:0.6 }}
              className="glass-gold"
              style={{ display:'inline-flex',alignItems:'center',gap:8,borderRadius:50,padding:'10px 22px',marginBottom:28 }}>
              <span style={{ fontSize:'1.3rem' }}>✨</span>
              <span className="gradient-text-gold font-grotesk" style={{ fontSize:'0.85rem',fontWeight:600 }}>Start Your Story Today</span>
            </motion.div>

            <motion.h2 className="section-title"
              initial={{ opacity:0,y:25 }} animate={inView?{opacity:1,y:0}:{}} transition={{ delay:0.3,duration:0.8 }}
              style={{ marginBottom:12 }}>
              Your Story Deserves More
            </motion.h2>
            <motion.h2 className="section-title gradient-text"
              initial={{ opacity:0,y:25 }} animate={inView?{opacity:1,y:0}:{}} transition={{ delay:0.4,duration:0.8 }}
              style={{ marginBottom:20 }}>
              Than a Greeting Card.
            </motion.h2>

            <motion.p className="font-grotesk"
              initial={{ opacity:0,y:18 }} animate={inView?{opacity:1,y:0}:{}} transition={{ delay:0.5,duration:0.7 }}
              style={{ color:'#888',fontSize:'1rem',lineHeight:1.75,maxWidth:500,margin:'0 auto 36px' }}>
              Create a magical online surprise that your loved ones will remember forever.
              Starting at just ₹299.
            </motion.p>

            <motion.div
              initial={{ opacity:0,y:18 }} animate={inView?{opacity:1,y:0}:{}} transition={{ delay:0.6,duration:0.7 }}
              style={{ display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:14 }}>
              <motion.button className="btn-primary" whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}>
                Create Website Now <ArrowRight size={16} />
              </motion.button>
              <motion.a
                href="https://wa.me/919999999999?text=Hi!%20I%20want%20to%20create%20a%20surprise%20website."
                target="_blank" rel="noopener noreferrer"
                className="btn-secondary" whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}>
                <MessageCircle size={17} style={{ color:'#25D366' }} />
                WhatsApp Us
              </motion.a>
            </motion.div>

            <motion.p
              initial={{ opacity:0 }} animate={inView?{opacity:1}:{}} transition={{ delay:0.9,duration:0.6 }}
              className="font-grotesk"
              style={{ marginTop:28,color:'#444',fontSize:'0.82rem' }}>
              ✨ 6 beautiful themes &nbsp;·&nbsp; ⚡ Ready in 24 hrs &nbsp;·&nbsp; 💰 100% satisfaction guarantee
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
