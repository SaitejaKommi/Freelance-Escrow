'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderOpen, Bot, Lock, BarChart3 } from 'lucide-react';

const navItems = [
  { href: '/',           icon: LayoutDashboard, label: 'Overview'      },
  { href: '/new',        icon: FolderOpen,      label: 'New Contract'  },
  { href: '/visualizer', icon: Bot,             label: 'AI Engine'     },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" className="sb-logo">
        <div className="sb-logo-icon">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L28 8.5V23.5L16 30L4 23.5V8.5L16 2Z"
              fill="rgba(123,104,238,0.2)" stroke="#7B68EE" strokeWidth="1.5" />
            <path d="M16 9L22 12.5V19.5L16 23L10 19.5V12.5L16 9Z"
              fill="rgba(123,104,238,0.5)" />
            <circle cx="16" cy="16" r="3" fill="#7B68EE" />
          </svg>
        </div>
        <div>
          <div className="sb-logo-text">TrustlessEscrow</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span className="dot dot-green" style={{ width: 5, height: 5 }} />
            <span className="font-mono" style={{ fontSize: 10, color: 'var(--i4)' }}>Monad Devnet</span>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <div className="sb-section">NAVIGATION</div>
      <nav style={{ flex: 1, padding: '4px 0' }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`sb-item${active ? ' active' : ''}`}>
              <item.icon style={{ width: 15, height: 15, flexShrink: 0, opacity: active ? 1 : 0.6 }} />
              {item.label}
              {active && (
                <span style={{
                  marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--vl)', flexShrink: 0,
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="sb-bottom">
        <div className="ai-status-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span className="dot dot-green" style={{ width: 5, height: 5 }} />
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--em)', letterSpacing: '0.08em' }}>
              AI ENGINE LIVE
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--i3)' }}>
            Verification ready
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--v), var(--teal))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            ES
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--i2)' }}>Escrow Platform</div>
            <div style={{ fontSize: 10, color: 'var(--i4)' }}>Pro Plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
