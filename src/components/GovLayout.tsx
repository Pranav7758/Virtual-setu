import React from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, FileText, ListChecks, CreditCard, HelpCircle, Zap, Crown, LayoutDashboard, UserCircle, Menu, X } from 'lucide-react';
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
  { to: '/dashboard?tab=profile', label: 'Profile', icon: UserCircle },
  { to: '/help', label: 'Help', icon: HelpCircle },
];

/* ── Ashoka Chakra SVG — 24-spoke dharma wheel ── */
function AshokaChakra({ size = 40 }: { size?: number }) {
  const cx = 20, cy = 20, outerR = 17.5, innerR = 5;
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 15 - 90) * (Math.PI / 180);
    return {
      x1: cx + innerR * Math.cos(angle),
      y1: cy + innerR * Math.sin(angle),
      x2: cx + outerR * Math.cos(angle),
      y2: cy + outerR * Math.sin(angle),
    };
  });
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#003580" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#003580" strokeWidth="1.5" />
      {spokes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#003580" strokeWidth="0.9" />
      ))}
    </svg>
  );
}

function PlanChip({ plan }: { plan: string }) {
  if (plan === 'platinum')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wide"><Crown className="h-3 w-3" /> Platinum</span>;
  if (plan === 'premium')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-blue-100 text-[#003580] border border-blue-300 uppercase tracking-wide"><Zap className="h-3 w-3" /> Premium</span>;
  return null;
}

/* CitizenNavItem — hook at component level, not inside map */
function CitizenNavItem({ to, label, icon: Icon, mobile, onClick }: {
  to: string; label: string; icon: React.ElementType; mobile?: boolean; onClick?: () => void;
}) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentTab = params.get('tab') || 'overview';

  let isActive: boolean;
  if (to === '/help') {
    isActive = location.pathname === '/help';
  } else if (to.startsWith('/dashboard')) {
    const toParams = new URLSearchParams(to.includes('?') ? to.split('?')[1] : '');
    const toTab = toParams.get('tab') || 'overview';
    isActive = location.pathname === '/dashboard' && currentTab === toTab;
  } else {
    isActive = location.pathname === to;
  }

  if (mobile) {
    return (
      <Link to={to} onClick={onClick}
        className={`flex items-center gap-2 py-2.5 px-3 text-sm border-b border-slate-100 ${
          isActive ? 'text-[#003580] font-semibold bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Icon className="h-4 w-4" /> {label}
      </Link>
    );
  }

  return (
    <Link to={to} onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
        isActive
          ? 'text-[#003580] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#003580]'
          : 'text-slate-600 hover:text-[#003580] hover:bg-slate-50'
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </Link>
  );
}

export default function GovLayout({ children, minimal = false }: GovLayoutProps) {
  const { user, signOut } = useAuth();
  const { plan } = useUserPlan();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleSignOut = async () => { await signOut(); navigate('/'); };
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen flex flex-col bg-[#eef2f7] text-[#0f172a]" style={{ fontFamily: "'Noto Sans','Segoe UI',Arial,sans-serif" }}>

      {/* ── Tricolor stripe ── */}
      <div className="h-1 flex shrink-0 z-50 sticky top-0">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white border-y border-gray-200" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* ── Government identity bar ── */}
      <div className="bg-[#003580] text-white text-[11px] shrink-0">
        <div className="container mx-auto max-w-7xl px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide">भारत सरकार · Government of India</span>
            <span className="text-blue-300 hidden sm:inline">|</span>
            <span className="text-blue-200 hidden sm:inline">Ministry of Electronics &amp; Information Technology</span>
          </div>
          <span className="hidden md:inline text-blue-200 tracking-wide text-[10px]">Digital India · डिजिटल इंडिया</span>
        </div>
      </div>

      {/* ── Main header: emblem + logo + plan/auth ── */}
      <header className="bg-white border-b-2 border-[#003580] shadow-sm shrink-0">
        <div className="container mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
          {/* Emblem + logo */}
          <Link to={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-3 min-w-0 shrink-0">
            <AshokaChakra size={40} />
            <div className="leading-tight min-w-0 border-l-2 border-[#003580] pl-3">
              <p className="font-bold text-[#003580] text-base sm:text-lg truncate leading-none">Virtual Setu</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">Secure Digital Document Portal · वर्चुअल सेतु</p>
            </div>
          </Link>

          {!minimal && (
            <div className="flex items-center gap-2 shrink-0">
              {isLoggedIn ? (
                <>
                  {plan === 'free' ? (
                    <Link to="/pricing"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#FF6200] hover:bg-[#d94f00] text-white rounded-sm transition-colors uppercase tracking-wide"
                    >
                      <Zap className="h-3 w-3" /> Upgrade Plan
                    </Link>
                  ) : (
                    <PlanChip plan={plan} />
                  )}
                  <button onClick={handleSignOut}
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-300 rounded-sm text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wide font-semibold"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth"
                    className="hidden sm:inline-flex px-4 py-1.5 text-sm text-[#003580] border border-[#003580] rounded-sm hover:bg-blue-50 font-semibold transition-colors"
                  >Login</Link>
                  <Link to="/register"
                    className="hidden sm:inline-flex px-4 py-1.5 text-sm bg-[#003580] text-white rounded-sm hover:bg-[#002060] font-semibold transition-colors"
                  >Register</Link>
                </>
              )}
              <button className="sm:hidden p-2 text-slate-700" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          )}

        </div>
      </header>

      {/* ── Navigation bar (separate row, official style) ── */}
      {!minimal && (
        <nav className="bg-[#f0f4fa] border-b border-[#c8d4e8] shrink-0 hidden sm:block">
          <div className="container mx-auto max-w-7xl px-4 flex items-center">
            {isLoggedIn ? (
              CITIZEN_NAV.map(n => (
                <CitizenNavItem key={n.to} to={n.to} label={n.label} icon={n.icon} />
              ))
            ) : (
              PUBLIC_NAV.map(n => (
                <NavLink key={n.to} to={n.to} end={n.to === '/'}
                  className={({ isActive }) =>
                    `relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-[#003580] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#003580]'
                        : 'text-slate-600 hover:text-[#003580] hover:bg-slate-100'
                    }`
                  }
                >{n.label}</NavLink>
              ))
            )}
          </div>
        </nav>
      )}

      {/* ── Mobile nav drawer ── */}
      {!minimal && open && (
        <div className="sm:hidden border-b-2 border-[#003580] bg-white shadow-md z-40">
          <div className="flex flex-col">
            {isLoggedIn ? (
              <>
                {CITIZEN_NAV.map(n => (
                  <CitizenNavItem key={n.to} to={n.to} label={n.label} icon={n.icon} mobile onClick={() => setOpen(false)} />
                ))}
                <div className="flex gap-2 p-3 border-t border-slate-100">
                  {plan === 'free' ? (
                    <Link to="/pricing" onClick={() => setOpen(false)}
                      className="flex-1 text-center py-2 text-sm font-bold bg-[#FF6200] text-white rounded-sm uppercase tracking-wide"
                    >⚡ Upgrade Plan</Link>
                  ) : (
                    <span className="flex-1 text-center py-2 text-sm font-bold text-[#003580]">
                      {plan === 'platinum' ? '🏅 Platinum' : '⚡ Premium'} Plan
                    </span>
                  )}
                  <button onClick={() => { setOpen(false); handleSignOut(); }}
                    className="flex-1 py-2 text-sm border border-slate-300 rounded-sm text-slate-700 font-semibold"
                  >Sign Out</button>
                </div>
              </>
            ) : (
              <>
                {PUBLIC_NAV.map(n => (
                  <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `py-2.5 px-4 text-sm border-b border-slate-100 ${isActive ? 'text-[#003580] font-semibold bg-blue-50' : 'text-slate-700'}`
                    }
                  >{n.label}</NavLink>
                ))}
                <div className="flex gap-2 p-3 border-t border-slate-100">
                  <Link to="/auth" onClick={() => setOpen(false)}
                    className="flex-1 text-center py-2 text-sm border border-[#003580] text-[#003580] rounded-sm font-semibold"
                  >Login</Link>
                  <Link to="/register" onClick={() => setOpen(false)}
                    className="flex-1 text-center py-2 text-sm bg-[#003580] text-white rounded-sm font-semibold"
                  >Register</Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-[#003580] text-blue-100 mt-8">
        <div className="container mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <AshokaChakra size={32} />
              <div>
                <p className="font-bold text-white text-sm">Virtual Setu</p>
                <p className="text-blue-300 text-[11px]">वर्चुअल सेतु</p>
              </div>
            </div>
            <p className="text-blue-200 text-xs leading-relaxed">
              A secure digital document management portal for every Indian citizen, powered by DigiLocker-compatible standards.
            </p>
          </div>
          <div>
            <p className="text-white font-bold mb-2 text-xs uppercase tracking-wide border-b border-blue-400/30 pb-1">Portal</p>
            <ul className="space-y-1.5 text-xs">
              {[['/', 'Home'], ['/features', 'Features'], ['/pricing', 'Pricing'], ['/about', 'About']].map(([to, label]) => (
                <li key={to}><Link to={to} className="hover:text-white hover:underline transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-bold mb-2 text-xs uppercase tracking-wide border-b border-blue-400/30 pb-1">Citizen Services</p>
            <ul className="space-y-1.5 text-xs">
              {[['/scan', 'Verify Document'], ['/auth', 'Citizen Login'], ['/register', 'New Registration'], ['/help', 'Help &amp; Support']].map(([to, label]) => (
                <li key={to}><Link to={to} className="hover:text-white hover:underline transition-colors" dangerouslySetInnerHTML={{ __html: label }} /></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-bold mb-2 text-xs uppercase tracking-wide border-b border-blue-400/30 pb-1">Contact &amp; Support</p>
            <ul className="space-y-1.5 text-xs text-blue-200">
              <li>support@virtualsetu.gov.in</li>
              <li>Toll-Free: 1800-XXX-XXXX</li>
              <li>Monday – Saturday</li>
              <li>09:00 – 18:00 IST</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-900/40 text-[11px] text-blue-200">
          <div className="container mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} Virtual Setu · Government of India · All rights reserved.</p>
            <p className="text-blue-300">Best viewed on modern browsers · WCAG 2.1 AA compliant · NIC standards</p>
          </div>
        </div>

        {/* Tricolor bottom strip */}
        <div className="h-1 flex">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>
      </footer>
    </div>
  );
}

/* ── GovPageHeader — official page header banner ── */
export function GovPageHeader({ title, subtitle, breadcrumb }: {
  title: string; subtitle?: string; breadcrumb?: string;
}) {
  return (
    <section className="bg-[#003580] text-white">
      <div className="container mx-auto max-w-7xl px-4 py-5">
        {breadcrumb && (
          <p className="text-[11px] text-blue-200 mb-1 tracking-widest uppercase">{breadcrumb}</p>
        )}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-blue-200 mt-1 text-sm max-w-3xl">{subtitle}</p>}
      </div>
      <div className="h-px bg-[#FF6200]/60" />
    </section>
  );
}

/* ── GovCard — official bordered card ── */
export function GovCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#cdd3da] rounded-sm shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/* ── GovSectionHeader — blue left-border section title ── */
export function GovSectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-l-4 border-[#003580] pl-3 mb-4">
      <h2 className="font-bold text-[#003580] text-base">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}
