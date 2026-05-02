import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, LogOut, FileText, ListChecks, CreditCard, HelpCircle, Zap, Crown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPlan } from '@/hooks/useUserPlan';

interface GovLayoutProps {
  children: React.ReactNode;
  minimal?: boolean;
}

const PUBLIC_NAV = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/scan', label: 'Verify Document' },
  { to: '/help', label: 'Help' },
];

const CITIZEN_NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard?tab=documents', label: 'My Documents', icon: FileText },
  { to: '/dashboard?tab=checklist', label: 'Checklist', icon: ListChecks },
  { to: '/dashboard?tab=digital-id', label: 'Digital ID', icon: CreditCard },
  { to: '/help', label: 'Help', icon: HelpCircle },
];

function PlanChip({ plan }: { plan: string }) {
  if (plan === 'platinum') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <Crown className="h-3 w-3" /> Platinum
      </span>
    );
  }
  if (plan === 'premium') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-100 text-[#0B3D91] border border-blue-200">
        <Zap className="h-3 w-3" /> Premium
      </span>
    );
  }
  return null;
}

export default function GovLayout({ children, minimal = false }: GovLayoutProps) {
  const { user, signOut } = useAuth();
  const { plan } = useUserPlan();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fb] text-[#0f172a] font-[Roboto,Arial,sans-serif]">
      {/* Tricolor top strip */}
      <div className="h-1 flex shrink-0">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Government top strip */}
      <div className="bg-[#0B3D91] text-white text-[11px]">
        <div className="container mx-auto max-w-7xl px-4 py-1 flex items-center justify-between">
          <span className="tracking-wide">Government of India · भारत सरकार</span>
          <span className="hidden sm:inline tracking-wide">Digital Document Management System</span>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-3 min-w-0 shrink-0">
            <div className="p-2 bg-[#0B3D91] rounded">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="font-bold text-[#0B3D91] text-base sm:text-lg truncate">Virtual Setu</p>
              <p className="text-[11px] text-slate-600 truncate">Digital Document Management System</p>
            </div>
          </Link>

          {!minimal && (
            <>
              {/* Desktop nav */}
              {isLoggedIn ? (
                /* ── LOGGED-IN NAV ── */
                <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
                  {CITIZEN_NAV.map((n) => (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      end={n.to === '/dashboard'}
                      className={({ isActive }) =>
                        `flex items-center gap-1.5 px-3 py-2 text-sm rounded transition-colors ${
                          isActive
                            ? 'text-[#0B3D91] font-semibold bg-blue-50'
                            : 'text-slate-700 hover:text-[#0B3D91] hover:bg-slate-50'
                        }`
                      }
                    >
                      <n.icon className="h-3.5 w-3.5" />
                      {n.label}
                    </NavLink>
                  ))}
                </nav>
              ) : (
                /* ── PUBLIC NAV ── */
                <nav className="hidden lg:flex items-center gap-1">
                  {PUBLIC_NAV.map((n) => (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      end={n.to === '/'}
                      className={({ isActive }) =>
                        `px-3 py-2 text-sm rounded transition-colors ${
                          isActive
                            ? 'text-[#0B3D91] font-semibold bg-blue-50'
                            : 'text-slate-700 hover:text-[#0B3D91] hover:bg-slate-50'
                        }`
                      }
                    >
                      {n.label}
                    </NavLink>
                  ))}
                </nav>
              )}

              {/* Desktop right-side actions */}
              <div className="hidden lg:flex items-center gap-2 shrink-0">
                {isLoggedIn ? (
                  <>
                    {plan === 'free' ? (
                      <Link
                        to="/pricing"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-[#FF9933] hover:bg-[#e8871e] text-white rounded transition-colors"
                      >
                        <Zap className="h-3.5 w-3.5" /> Upgrade Plan
                      </Link>
                    ) : (
                      <PlanChip plan={plan} />
                    )}
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      className="px-3 py-2 text-sm text-[#0B3D91] hover:bg-blue-50 rounded font-medium transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-3 py-2 text-sm bg-[#0B3D91] text-white rounded hover:bg-[#082c6c] font-medium transition-colors"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-2 text-slate-700"
                onClick={() => setOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          )}
        </div>

        {/* Mobile nav */}
        {!minimal && open && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <div className="container mx-auto max-w-7xl px-4 py-2 flex flex-col">
              {isLoggedIn ? (
                <>
                  {CITIZEN_NAV.map((n) => (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      end={n.to === '/dashboard'}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 py-2.5 px-2 text-sm border-b border-slate-100 ${
                          isActive ? 'text-[#0B3D91] font-semibold' : 'text-slate-700'
                        }`
                      }
                    >
                      <n.icon className="h-4 w-4" />
                      {n.label}
                    </NavLink>
                  ))}
                  <div className="flex gap-2 py-3">
                    {plan === 'free' ? (
                      <Link
                        to="/pricing"
                        onClick={() => setOpen(false)}
                        className="flex-1 text-center py-2 text-sm font-semibold bg-[#FF9933] hover:bg-[#e8871e] text-white rounded"
                      >
                        ⚡ Upgrade Plan
                      </Link>
                    ) : (
                      <span className="flex-1 text-center py-2 text-sm font-semibold text-[#0B3D91]">
                        {plan === 'platinum' ? '🏅 Platinum' : '⚡ Premium'} Plan
                      </span>
                    )}
                    <button
                      onClick={() => { setOpen(false); handleSignOut(); }}
                      className="flex-1 py-2 text-sm border border-slate-300 rounded text-slate-700"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {PUBLIC_NAV.map((n) => (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      end={n.to === '/'}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `py-2 px-2 text-sm border-b border-slate-100 ${
                          isActive ? 'text-[#0B3D91] font-semibold' : 'text-slate-700'
                        }`
                      }
                    >
                      {n.label}
                    </NavLink>
                  ))}
                  <div className="flex gap-2 py-3">
                    <Link
                      to="/auth"
                      onClick={() => setOpen(false)}
                      className="flex-1 text-center py-2 text-sm border border-[#0B3D91] text-[#0B3D91] rounded"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setOpen(false)}
                      className="flex-1 text-center py-2 text-sm bg-[#0B3D91] text-white rounded"
                    >
                      Register
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#0B3D91] text-blue-100 mt-12">
        <div className="container mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-white" />
              <p className="font-semibold text-white">Virtual Setu</p>
            </div>
            <p className="text-blue-200 text-xs leading-relaxed">
              A secure, government-style digital document management portal for every Indian citizen.
            </p>
          </div>
          <div>
            <p className="text-white font-semibold mb-2">Portal</p>
            <ul className="space-y-1 text-xs">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/features" className="hover:text-white">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link to="/about" className="hover:text-white">About</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-2">Citizen Services</p>
            <ul className="space-y-1 text-xs">
              <li><Link to="/scan" className="hover:text-white">Verify Document</Link></li>
              <li><Link to="/auth" className="hover:text-white">Login</Link></li>
              <li><Link to="/register" className="hover:text-white">Register</Link></li>
              <li><Link to="/help" className="hover:text-white">Help &amp; Support</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-2">Contact</p>
            <ul className="space-y-1 text-xs">
              <li>support@virtualsetu.in</li>
              <li>Toll-free: 1800-XXX-XXXX</li>
              <li>Mon–Sat · 9:00 – 18:00 IST</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-900/40 text-[11px] text-blue-200">
          <div className="container mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} Virtual Setu · All rights reserved.</p>
            <p className="text-blue-300">Best viewed on modern browsers · Compliant with WCAG 2.1 AA</p>
          </div>
        </div>

        <div className="h-1 flex">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>
      </footer>
    </div>
  );
}

/* ─────────── Reusable gov section helpers ─────────── */
export function GovPageHeader({
  title,
  subtitle,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
}) {
  return (
    <section className="bg-white border-b border-slate-200">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {breadcrumb && (
          <p className="text-xs text-slate-500 mb-1 tracking-wide uppercase">{breadcrumb}</p>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0B3D91]">{title}</h1>
        {subtitle && <p className="text-slate-600 mt-1 max-w-3xl">{subtitle}</p>}
      </div>
    </section>
  );
}

export function GovCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-md shadow-sm ${className}`}>
      {children}
    </div>
  );
}
