import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    icon: '🚗',
    bg: 'rgba(124,92,252,.15)',
    title: 'Premium Fleet',
    desc: 'Choose from luxury sedans, executive SUVs, and business-class vehicles for every occasion.',
  },
  {
    icon: '👨‍✈️',
    bg: 'rgba(34,211,238,.12)',
    title: 'Professional Drivers',
    desc: 'All drivers are fully licensed, background-checked, and trained for your comfort and safety.',
  },
  {
    icon: '🕐',
    bg: 'rgba(251,191,36,.12)',
    title: '24/7 Availability',
    desc: "Book any time, day or night. We operate around the clock so you're never stranded.",
  },
  {
    icon: '📱',
    bg: 'rgba(16,185,129,.12)',
    title: 'Easy Booking',
    desc: 'Book your ride in under 60 seconds. Enter your pickup, destination, and you\'re done.',
  },
]

const steps = [
  { n: '1', title: 'Create your account', desc: 'Register in seconds with your name and email address.' },
  { n: '2', title: 'Choose your ride',    desc: 'Select standard or premium class and enter your route details.' },
  { n: '3', title: 'Enjoy the journey',   desc: 'A professional driver will pick you up at the scheduled time.' },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-stars" aria-hidden="true" />

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Bahrain's Premier Travel Service
        </div>

        <h1>
          Your Journey,<br />Elevated.
        </h1>

        <p className="hero-sub">
          Uranus Travel & Tourism connects you with professional drivers and luxury vehicles for seamless travel across Bahrain.
        </p>

        <div className="hero-cta">
          <Link to={user ? '/booking' : '/register'} className="btn-primary">
            🚀 Book a Ride
          </Link>
          <Link to="/login" className="btn-ghost">
            Sign In
          </Link>
        </div>

        <div className="hero-scroll" aria-hidden="true">
          <span>Scroll</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <p className="section-label">Why choose us</p>
        <h2 className="section-title">Travel in comfort & style</h2>
        <p className="section-sub">Everything you need for a smooth, stress-free journey from booking to drop-off.</p>

        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="steps-section">
        <div className="steps-inner">
          <p className="section-label">How it works</p>
          <h2 className="section-title" style={{ marginBottom: 40 }}>Three steps to your ride</h2>
          <div className="steps-grid">
            {steps.map((s) => (
              <div className="step-card" key={s.n}>
                <div className="step-number">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <div className="navbar-logo" style={{ width: 28, height: 28, fontSize: 13, borderRadius: 8 }}>U</div>
          Uranus Travel & Tourism
        </div>
        <p className="footer-copy">© 2026 Uranus Travel. All rights reserved.</p>
      </footer>
    </>
  )
}
