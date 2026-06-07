'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  Plus,
  Wallet,
  Zap,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'           },
  { href: '/new',        icon: FolderKanban,    label: 'New Escrow'          },
  { href: '/visualizer', icon: Bot,             label: 'Verification Center' },
];

function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const getAddress = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
        }
      }
    };
    getAddress();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        setAddress(null);
      }
    };

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleConnect = async () => {
    try {
      const { connectWallet } = await import('@/lib/wallet');
      const { address: addr } = await connectWallet();
      setAddress(addr);
    } catch (e: any) {
      alert('Failed to connect wallet: ' + e.message);
    }
  };

  return (
    <button
      className="wallet-btn"
      onClick={handleConnect}
    >
      <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}</span>
    </button>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" className="sb-logo">
        <div className="sb-logo-icon">
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 2.5V15.5M4 9L13.5 2.5M4 9L13.5 15.5" stroke="var(--bg-card)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div className="sb-logo-name">krow</div>
          <div className="sb-logo-tag">AI-Verified Escrow</div>
        </div>
      </Link>

      {/* Nav */}
      <div className="sb-section">Navigation</div>
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sb-item${active ? ' active' : ''}`}
            >
              <item.icon className="sb-icon" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Quick action */}
      <div style={{ padding: '0 10px 12px' }}>
        <Link
          href="/new"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: '9px' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Escrow
        </Link>
      </div>

      {/* Bottom — status + wallet */}
      <div className="sb-bottom">
        {/* Network status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 4px 9px', marginBottom: 8, borderBottom: '1px solid var(--border)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>Monad Devnet</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--success)', fontWeight: 600, letterSpacing: '0.04em' }}>LIVE</span>
        </div>

        {/* AI Engine */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 4px 10px', marginBottom: 8, borderBottom: '1px solid var(--border)' }}>
          <Zap className="w-3.5 h-3.5" style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>AI Engine</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--warning)', fontWeight: 600, letterSpacing: '0.04em' }}>READY</span>
        </div>

        <WalletButton />
      </div>
    </aside>
  );
}
