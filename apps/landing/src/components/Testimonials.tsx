import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  { name:'Priya Mehta',   loc:'Mumbai',    init:'PM', occ:'Birthday Surprise',   color:'#d69e5f', bg:'rgba(214,158,95,0.12)',  tag:'🎂 Birthday',
    text:'I ordered a birthday website for my husband and he literally cried when he saw it. The photos, the music, the family messages — it was beyond anything I could have imagined. Just4You.buzz is pure magic!', rating:5 },
  { name:'Arjun & Sneha', loc:'Bangalore', init:'AS', occ:'10th Anniversary',    color:'#e8758a', bg:'rgba(232,117,138,0.12)', tag:'❤️ Anniversary',
    text:'For our 10th anniversary we wanted something truly special. The team created a beautiful timeline of our 10 years together. Our family is still talking about it months later — absolutely worth every rupee!', rating:5 },
  { name:'Rahul Sharma',  loc:'Delhi',     init:'RS', occ:'Proposal Website',    color:'#9b6dff', bg:'rgba(155,109,255,0.12)', tag:'💍 Proposal',
    text:'I proposed using the website and she said YES! The countdown, the love story timeline, the photos — she was completely surprised. Just4You.buzz made the most important moment of my life absolutely perfect.', rating:5 },
  { name:'Kavya Nair',    loc:'Kochi',     init:'KN', occ:"Kids Birthday",       color:'#4ecdc4', bg:'rgba(78,205,196,0.12)',  tag:"👶 Kids Birthday",
    text:"My daughter's 5th birthday website had her favourite characters, all her friends' wishes and a photo slideshow. She watches it every week — it became her most treasured birthday memory.", rating:5 },
  { name:'Vikram Patel',  loc:'Ahmedabad', init:'VP', occ:'Graduation Surprise', color:'#d69e5f', bg:'rgba(214,158,95,0.12)',  tag:'🎓 Graduation',
    text:'Created a graduation website for my sister — messages from professors, college memories, achievement showcase. She cried happy tears. Best ₹299 I have ever spent in my life!', rating:5 },
]

export default function Testimonials() {
  const [current, setCurrent] = useState(0)
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once:true, margin:'-80px' })
  const t      = testimonials[current]

  return (
    <section id="testimonials" style={{
      position:'relative', padding:'96px 0', overflow:'hidden',
      background:'linear-gradient(180deg,#0c0c0c 0%,#0e0a16 50%,#0c0c0c 100%)',
    }}>
      <div className="orb orb-rose"  style={{ width:420,height:420,top:'5%',right:'-10%',opacity:0.07 }} />
      <div className="orb orb-gold"  style={{ width:340,height:340,bottom:'5%',left:'-8%',opacity:0.06 }} />

      <div ref={ref} className="container-xl" style={{ maxWidth:760 }}>
        {/* Heading */}
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <motion.span className="section-label" style={{ color:'#e8758a' }}
            initial={{ opacity:0,y:16 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.5 }}>
            Customer Stories
          </motion.span>
          <motion.h2 className="section-title"
            initial={{ opacity:0,y:24 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.7,delay:0.1 }}>
            Moments That Made <span className="gradient-text">Them Cry Happy Tears</span>
          </motion.h2>
        </div>

        {/* Carousel card */}
        <motion.div initial={{ opacity:0,y:30 }} animate={inView?{opacity:1,y:0}:{}} transition={{ duration:0.7,delay:0.2 }}>
          <AnimatePresence mode="wait">
            <motion.div key={current}
              initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-14 }}
              transition={{ duration:0.35 }}
              style={{ borderRadius:24,padding:'36px 40px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)' }}>

              {/* Top row */}
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
                <span className="font-grotesk" style={{ fontSize:'0.78rem',fontWeight:600,padding:'5px 12px',borderRadius:50,background:t.bg,color:t.color }}>
                  {t.tag}
                </span>
                <div style={{ display:'flex',gap:4 }}>
                  {Array.from({length:t.rating}).map((_,i)=><Star key={i} size={13} fill="#d69e5f" color="#d69e5f" />)}
                </div>
              </div>

              <Quote size={26} style={{ color:t.color,opacity:0.4,marginBottom:12 }} />

              <p className="font-grotesk" style={{ color:'#c5c5c5',fontSize:'1rem',lineHeight:1.8,fontStyle:'italic',marginBottom:24 }}>
                "{t.text}"
              </p>

              {/* Person */}
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div className="font-grotesk" style={{
                  width:42,height:42,borderRadius:'50%',flexShrink:0,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  background:t.bg,color:t.color,fontWeight:700,fontSize:'0.85rem',
                  border:`1.5px solid ${t.color}40`,
                }}>{t.init}</div>
                <div>
                  <div className="font-grotesk" style={{ color:'#eee',fontWeight:600,fontSize:'0.9rem' }}>{t.name}</div>
                  <div className="font-grotesk" style={{ color:'#555',fontSize:'0.78rem' }}>{t.loc} · {t.occ}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginTop:24 }}>
            <button onClick={()=>setCurrent(c=>(c-1+testimonials.length)%testimonials.length)}
              style={{ width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'#666',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ display:'flex',gap:8 }}>
              {testimonials.map((_,i)=>(
                <button key={i} onClick={()=>setCurrent(i)}
                  style={{ width:i===current?22:7,height:7,borderRadius:4,border:'none',cursor:'pointer',padding:0,transition:'all 0.3s',background:i===current?'#d69e5f':'rgba(255,255,255,0.12)' }} />
              ))}
            </div>
            <button onClick={()=>setCurrent(c=>(c+1)%testimonials.length)}
              style={{ width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'#666',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
