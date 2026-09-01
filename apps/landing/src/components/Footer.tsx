import { Sparkles, Heart, Camera, X, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ background:'#080808', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'56px 0 32px' }}>
      <div className="container-xl">
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:48, marginBottom:48 }}>
          {/* Brand */}
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:14 }}>
              <div style={{ width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#d69e5f,#e8758a)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Sparkles size={15} color="white" />
              </div>
              <span className="font-display" style={{ fontWeight:700,fontSize:'1.1rem',color:'#f5f5f5' }}>
                Just4You<span className="gradient-text-gold">.buzz</span>
              </span>
            </div>
            <p className="font-grotesk" style={{ color:'#505050',fontSize:'0.85rem',lineHeight:1.7,maxWidth:280,marginBottom:18 }}>
              Turning Special Moments Into Beautiful Digital Memories. Creating personalized surprise websites since 2023.
            </p>
            <div style={{ display:'flex',gap:10 }}>
              {[{ Icon:Camera,c:'#e8758a',l:'Instagram'},{Icon:X,c:'#9b6dff',l:'X'},{Icon:Mail,c:'#d69e5f',l:'Email'}].map(({Icon,c,l})=>(
                <a key={l} href="#" title={l}
                  style={{ width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#555',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',transition:'all 0.2s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=c; e.currentTarget.style.color=c }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#555' }}>
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Occasions */}
          <div>
            <h4 className="font-grotesk" style={{ color:'#e0e0e0',fontSize:'0.88rem',fontWeight:600,marginBottom:16 }}>Occasions</h4>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {['Birthday Websites','Proposal Websites','Anniversary Websites','Kids Birthdays','Graduation','Custom Events'].map(item=>(
                <a key={item} href="#occasions" style={{ color:'#555',textDecoration:'none',fontSize:'0.83rem',fontFamily:"'Space Grotesk',sans-serif",transition:'color 0.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.color='#d69e5f'}
                  onMouseLeave={e=>e.currentTarget.style.color='#555'}>
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-grotesk" style={{ color:'#e0e0e0',fontSize:'0.88rem',fontWeight:600,marginBottom:16 }}>Company</h4>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {['About Us','Pricing','How It Works','Testimonials','Privacy Policy','Terms of Service'].map(item=>(
                <a key={item} href="#" style={{ color:'#555',textDecoration:'none',fontSize:'0.83rem',fontFamily:"'Space Grotesk',sans-serif",transition:'color 0.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.color='#d69e5f'}
                  onMouseLeave={e=>e.currentTarget.style.color='#555'}>
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:24,borderTop:'1px solid rgba(255,255,255,0.06)',flexWrap:'wrap',gap:12 }}>
          <p className="font-grotesk" style={{ color:'#383838',fontSize:'0.78rem' }}>© 2025 Just4You.buzz · All rights reserved</p>
          <p className="font-grotesk" style={{ color:'#383838',fontSize:'0.78rem',display:'flex',alignItems:'center',gap:5 }}>
            Made with <Heart size={11} style={{ color:'#e8758a' }} fill="#e8758a" /> for every celebration
          </p>
        </div>
      </div>
    </footer>
  )
}
