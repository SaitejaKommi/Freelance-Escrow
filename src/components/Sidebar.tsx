'use client';
import Link         from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Plus, Cpu, BookOpen, Zap } from 'lucide-react';

const navItems = [
  { href: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/new',       icon: Plus,            label: 'New Project' },
  { href: '/visualizer', icon: Cpu,            label: 'AI Monitor'  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full font-sans"
      style={{ background: '#0e0c0a', borderRight: '1px solid #2e2b26' }}>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid #2e2b26' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(218,119,86,0.15)', border: '1px solid rgba(218,119,86,0.3)' }}>
          <ShieldCheck className="w-4 h-4" style={{ color: '#DA7756' }} />
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: '#F5ECD7' }}>TrustlessEscrow</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="pulse-dot" style={{ width: 6, height: 6 }} />
            <span className="font-mono text-xs" style={{ color: '#5a5248' }}>Monad Devnet</span>
          </div>
        </div>
      </Link>

      {/* Pixel grass divider */}
      <div className="px-div" style={{ margin: 0, height: 2, opacity: 0.35 }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-all duration-100"
              style={{
                color:      active ? '#DA7756' : '#9a8f82',
                background: active ? 'rgba(218,119,86,0.08)' : 'transparent',
                border:     `1px solid ${active ? 'rgba(218,119,86,0.2)' : 'transparent'}`,
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#F5ECD7'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#9a8f82'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#DA7756' }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer info strip */}
      <div style={{ borderTop: '1px solid #2e2b26', padding: 12 }}>
        <div className="code-flavor text-xs" style={{ padding: '6px 10px' }}>
          <span className="kw">const</span> <span className="fn">audit</span> = <span className="fn">AI</span>(<span className="st">"github"</span>)<div className="term-cursor inline-block" />
        </div>
      </div>
    </aside>
  );
}
