import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

const occasions = [
  { emoji:'🎂', title:'Birthday Websites',      desc:'A personalized birthday page with photo memories, music, countdown & surprise reveal.', tag:'Most Popular', c:'#d69e5f', bg:'rgba(214,158,95,0.1)', border:'rgba(214,158,95,0.2)' },
  { emoji:'💍', title:'Proposal Websites',       desc:'A once-in-a-lifetime digital love story with your journey, photos & heartfelt message.', tag:'Most Romantic', c:'#e8758a', bg:'rgba(232,117,138,0.1)', border:'rgba(232,117,138,0.2)' },
  { emoji:'❤️', title:'Anniversary Websites',    desc:'Celebrate togetherness with a beautiful timeline of your shared journey & memories.', tag:'Trending', c:'#9b6dff', bg:'rgba(155,109,255,0.1)', border:'rgba(155,109,255,0.2)' },
  { emoji:'👶', title:'Kids Birthday',           desc:'Colorful, playful birthday pages with fun surprises, wishes & precious childhood moments.', tag:'Adorable', c:'#4ecdc4', bg:'rgba(78,205,196,0.1)', border:'rgba(78,205,196,0.2)' },
  { emoji:'🎓', title:'Graduation Websites',     desc:'Honour the achievement with a premium digital tribute celebrating years of dedication.', tag:'New', c:'#d69e5f', bg:'rgba(214,158,95,0.1)', border:'rgba(214,158,95,0.2)' },
  { emoji:'🎉', title:'Custom Celebrations',     desc:'Weddings, engagements, friendships, reunions — any occasion crafted beautifully for you.', tag:'Fully Custom', c:'#e8758a', bg:'rgba(232,117,138,0.1)', border:'rgba(232,117,138,0.2)' },
]

function OccasionCard({ occ, index }: { occ: typeof occasions[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity:0, y:40 }}
      animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ duration:0.6, delay:(index%3)*0.1 }}
      whileHover={{ y:-6, transition:{ duration:0.25 } }}
      style={{
        position:'relative', padding:24, borderRadius:18, cursor:'default',
        background:occ.bg, border:`1px solid ${occ.border}`,
        display:'flex', flexDirection:'column', gap:16,
      }}
    >
      {/* Tag */}
      <span className="font-grotesk" style={{
        position:'absolute', top:14, right:14,
        fontSize:'0.72rem', fontWeight:600, padding:'4px 10px', borderRadius:50,
        background:`${occ.c}20`, color:occ.c,
      }}>{occ.tag}</span>

      {/* Emoji box */}
      <div style={{
        width:52, height:52, borderRadius:14, fontSize:'1.6rem',
        display:'flex', alignItems:'center', justifyContent:'center',
        background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)',
        flexShrink:0,
      }}>{occ.emoji}</div>

      {/* Text */}
      <div>
        <h3 className="font-display" style={{ color:'#f0f0f0', fontSize:'1.05rem', fontWeight:700, marginBottom:8 }}>
          {occ.title}
        </h3>
        <p className="font-grotesk" style={{ color:'#888', fontSize:'0.88rem', lineHeight:1.65 }}>
          {occ.desc}
        </p>
      </div>

      {/* CTA link */}
      <button className="font-grotesk" style={{
        display:'flex', alignItems:'center', gap:5,
        color:occ.c, background:'none', border:'none', cursor:'pointer',
        padding:0, fontSize:'0.85rem', fontWeight:600, marginTop:'auto',
      }}>
        View Demo <ExternalLink size={13} />
      </button>
    </motion.div>
  )
}

export default function Occasions() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="occasions" style={{ position:'relative', padding:'96px 0', overflow:'hidden', background:'#0c0c0c' }}>
      <div className="orb orb-purple" style={{ width:400,height:400,top:'5%',right:'-10%',opacity:0.07 }} />
      <div className="orb orb-rose"   style={{ width:300,height:300,bottom:'5%',left:'-8%',opacity:0.06 }} />

      <div className="container-xl">
        {/* Heading — centered */}
        <div ref={ref} style={{ textAlign:'center', marginBottom:56 }}>
          <motion.span className="section-label" style={{ color:'#d69e5f' }}
            initial={{ opacity:0, y:16 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.5 }}>
            Featured Occasions
          </motion.span>
          <motion.h2 className="section-title"
            initial={{ opacity:0, y:24 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.7,delay:0.1 }}>
            Every Moment Deserves{' '}
            <span className="gradient-text">Something Beautiful</span>
          </motion.h2>
          <motion.p className="section-subtitle" style={{ maxWidth:520, margin:'14px auto 0' }}
            initial={{ opacity:0 }} animate={inView?{opacity:1}:{}} transition={{ duration:0.5,delay:0.2 }}>
            From intimate celebrations to grand announcements — we craft digital experiences that leave people speechless.
          </motion.p>
        </div>

        {/* 3-col grid */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',
          gap:20,
        }}>
          {occasions.map((occ, i) => <OccasionCard key={occ.title} occ={occ} index={i} />)}
        </div>
      </div>
    </section>
  )
}
