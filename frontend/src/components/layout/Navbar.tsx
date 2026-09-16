import { Link, useLocation } from 'react-router-dom'
import { useSimulationStore } from '../../store/simulationStore'

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/simulation', label: 'Simulation' },
  { path: '/risk', label: 'Risk Analysis' },
  { path: '/objects', label: 'Objects' },
  { path: '/methodology', label: 'Methodology' },
]

export default function Navbar() {
  const location = useLocation()
  const { toggleSidebar, sidebarOpen } = useSimulationStore()

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center px-4 border-b border-border-subtle"
      style={{ background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-3 mr-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)" />
            <circle cx="12" cy="12" r="2" fill="white" />
          </svg>
        </div>
        <span className="font-display font-bold text-lg tracking-tight text-gradient-cyan">
          ORBITAL SHIELD
        </span>
      </div>

      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              location.pathname === link.path
                ? 'text-accent-cyan bg-accent-cyan/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex-1" />

      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Toggle sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {sidebarOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      <div className="hidden lg:block">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
