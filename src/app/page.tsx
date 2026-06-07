'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, GitBranch, Bot, Lock, TrendingUp, Zap } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import type { Project, BlockchainTx } from '@/lib/types';

function fmt$(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const sw = 4, r = (size - sw * 2) / 2, circ = 2 * Math.PI * r;
  const color = score === 0 ? '#33334a' : score >= 80 ? '#22c55e' : score >= 50 ? '#7B68EE' : '#f59e0b';
  const ref = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const dash = (score / 100) * circ;
    setTimeout(() => { el.style.strokeDasharray = `${dash} ${circ}`; }, 80);
  }, [score, circ]);
  return (
    <div className="ring-wrap" style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
        <circle ref={ref} cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={`0 ${circ}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div className="ring-label">
        <span style={{ fontSize: Math.round(size*0.22), fontWeight: 800, color, lineHeight: 1 }}>{score===0?'—':score}</span>
        {score > 0 && <span style={{ fontSize: Math.round(size*0.15), color: 'var(--i4)' }}>%</span>}
      </div>
    </div>
  );
}

function getAIStatus(p: Project): { label: string; cls: string } {
  if (p.escrow_status === 'Released') return { label: 'AI Verified ✓',     cls: 'badge badge-green'  };
  if (p.escrow_status === 'Funded')   return { label: 'Awaiting Review',   cls: 'badge badge-amber'  };
  if (p.escrow_status === 'Refunded') return { label: 'Refunded',          cls: 'badge badge-red'    };
  return                                     { label: 'Draft',             cls: 'badge badge-gray'   };
}

export default function Dashboard() {
  const [projects,  setProjects]  = useState<Project[]>([]);
  const [balances,  setBalances]  = useState({ client: 0, freelancer: 0, contract: 0 });
  const [loading,   setLoading]   = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, txRes] = await Promise.all([fetch('/api/projects'), fetch('/api/blockchain')]);
      const pData = await pRes.json();
      const txData = await txRes.json();
      if (pData.success) setProjects(pData.data);
      if (txData.success) setBalances(txData.data.balances);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const totalEscrowed = projects.reduce((s, p) => s + p.escrow_amount, 0);
  const verified      = projects.filter(p => p.escrow_status === 'Released').length;

  const stats = [
    { icon: '🤖', label: 'Projects Verified',   val: String(projects.length), sub: `${verified} fully released`,     cls: 'stat-purple' },
    { icon: '🔒', label: 'Total Verified Value', val: fmt$(totalEscrowed),     sub: 'in active escrow',               cls: 'stat-teal'   },
    { icon: '🎯', label: 'AI Accuracy Rate',     val: '94%',                   sub: 'average confidence score',       cls: 'stat-green'  },
    { icon: '💸', label: 'Funds Released By AI', val: fmt$(balances.freelancer), sub: 'paid to developers',           cls: 'stat-amber'  },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="font-mono" style={{ fontSize: 9, color: 'var(--i4)', letterSpacing: '0.1em', marginBottom: 2 }}>DASHBOARD · OVERVIEW</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--i1)', letterSpacing: '-0.02em' }}>Escrow Manager</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 100, padding: '4px 12px' }}>
              <span className="dot dot-green" style={{ width: 5, height: 5 }} />
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--em)', letterSpacing: '0.08em' }}>AI ENGINE LIVE</span>
            </div>
            <button onClick={loadData} className="btn-ghost" style={{ padding: '7px 12px' }}>
              <RefreshCw style={{ width: 14, height: 14 }} />
            </button>
            <Link href="/new" className="btn-primary">
              <Plus style={{ width: 14, height: 14 }} /> New Contract
            </Link>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>

            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--i1)', marginBottom: 4 }}>Welcome back 👋</h1>
              <p style={{ fontSize: 13, color: 'var(--i3)' }}>
                {loading ? 'Loading contracts…' : `${projects.length} escrow contract${projects.length !== 1 ? 's' : ''} · AI verification active`}
              </p>
            </div>

            {/* Stats */}
            {!loading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 32 }}>
                {stats.map(s => (
                  <div key={s.label} className={`stat-card ${s.cls}`}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-val">{s.val}</div>
                    <div className="stat-sub">{s.sub}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Contract list */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--i1)' }}>Your Contracts</h2>
              <div className="sect-label" style={{ margin: 0 }}>{loading ? '…' : `${projects.length} total`}</div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 110, borderRadius: 16 }} />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="card" style={{ padding: 64, textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: 'var(--i1)' }}>No contracts yet</h3>
                <p style={{ fontSize: 13, color: 'var(--i3)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 28px' }}>
                  Describe your project requirements and the AI will automatically plan verifiable milestones.
                  Freelancer progress is then verified against your GitHub repository.
                </p>
                <Link href="/new" className="btn-primary" style={{ fontSize: 14, padding: '10px 24px' }}>
                  <Plus style={{ width: 15, height: 15 }} /> Create First Contract
                </Link>
              </div>
            ) : (
              projects.map(p => {
                const aiStatus = getAIStatus(p);
                const score = p.escrow_status === 'Released' ? 100 : 0;
                return (
                  <Link key={p.id} href={`/project/${p.id}`} className="proj-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' as const }}>
                          <span className="font-mono" style={{ fontSize: 9, color: 'var(--i4)', letterSpacing: '0.07em' }}>ESCROW CONTRACT</span>
                          <span className={aiStatus.cls}><span className="badge-dot" /> {aiStatus.label}</span>
                        </div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--i1)' }}>{p.title}</h3>
                        <p style={{ fontSize: 12, color: 'var(--i3)', marginBottom: 10, lineHeight: 1.5 }}>
                          {p.description?.slice(0, 110)}{(p.description?.length ?? 0) > 110 ? '…' : ''}
                        </p>
                        {p.github_url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--vl)' }}>
                            <GitBranch style={{ width: 10, height: 10 }} />
                            <span className="font-mono">{p.github_url.replace('https://github.com/', '')}</span>
                          </div>
                        )}
                      </div>
                      <ScoreRing score={score} size={52} />
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 12, alignItems: 'center' }}>
                      <span style={{ color: 'var(--i3)' }}>Budget <strong style={{ color: 'var(--i1)' }}>{fmt$(p.escrow_amount)}</strong></span>
                      {p.escrow_status === 'Released' && (
                        <span style={{ color: 'var(--em)', fontWeight: 600, fontSize: 11 }}>✓ AI Verified & Released</span>
                      )}
                      <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--i4)' }}>
                        {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
