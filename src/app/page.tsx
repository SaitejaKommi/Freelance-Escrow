'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, RefreshCw, ShieldCheck, Coins, CheckCircle, Clock,
  AlertTriangle, GitBranch, Zap, BookOpen, FileCode, Database,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import type { Project, BlockchainTx } from '@/lib/types';

const statusCfg: Record<string, { label: string; cls: string }> = {
  Created:  { label: 'Created',  cls: 'badge badge-amber'  },
  Funded:   { label: 'Funded',   cls: 'badge badge-cyan'   },
  Released: { label: 'Released', cls: 'badge badge-green'  },
  Refunded: { label: 'Refunded', cls: 'badge badge-orange' },
};

export default function Dashboard() {
  const [projects,     setProjects]     = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<BlockchainTx[]>([]);
  const [balances,     setBalances]     = useState({ client: 1000, freelancer: 250, contract: 0 });
  const [loading,      setLoading]      = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [projRes, txRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/blockchain'),
      ]);
      const projData = await projRes.json();
      const txData   = await txRes.json();
      if (projData.success) setProjects(projData.data);
      if (txData.success) {
        setTransactions(txData.data.transactions);
        setBalances(txData.data.balances);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const stats = [
    { label: 'Escrow Contracts', value: projects.length,                                                color: '#DA7756', icon: ShieldCheck },
    { label: 'Client Wallet',    value: `${balances.client.toFixed(1)} MON`,                            color: '#67e8f9', icon: Coins      },
    { label: 'Escrow Locked',    value: `${balances.contract.toFixed(1)} MON`,                          color: '#c084fc', icon: Zap        },
    { label: 'Freelancer Paid',  value: `${balances.freelancer.toFixed(1)} MON`,                        color: '#4ade80', icon: CheckCircle },
  ];

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#0e0c0a' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-4"
          style={{ background: 'rgba(14,12,10,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2e2b26' }}>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold" style={{ color: '#F5ECD7' }}>Dashboard</h1>
              <div className="term-cursor" />
            </div>
            <p className="text-sm mt-0.5" style={{ color: '#5a5248' }}>Manage your trustless escrow contracts</p>
          </div>
          <div className="flex items-center gap-2">
            <button id="refresh-btn" onClick={loadData} className="btn-ghost" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link href="/new" id="new-project-btn" className="btn-primary text-sm px-5 py-2">
              <Plus className="w-4 h-4" />
              New Escrow
            </Link>
          </div>
        </div>

        <div className="px-7 py-6 space-y-6">

          {/* Code flavor strip */}
          <div className="code-flavor">
            <span className="cm">// trustless_escrow.ts — </span>
            <span className="kw">const</span> <span className="fn">verdict</span> = <span className="kw">await</span> <span className="fn">AI</span>.<span className="fn">audit</span>(<span className="st">"github"</span>, <span className="st">"milestones"</span>)
            <span className="cm"> // evidence-only · no assumptions</span>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map(s => (
                <div key={s.label} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    <span className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
                  </div>
                  <p className="text-xs" style={{ color: '#9a8f82' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Grid: Contracts (left) + Blockchain TX Log (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Project list */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#5a5248' }}>
                <Database className="w-3.5 h-3.5" style={{ color: '#DA7756' }} /> Active Contracts
              </h2>

              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="glass-card h-20 shimmer" />)}
                </div>
              ) : projects.length === 0 ? (
                <div className="glass-card p-16 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(218,119,86,0.35)' }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#F5ECD7' }}>No escrow contracts yet</h3>
                  <p className="text-sm mb-6" style={{ color: '#9a8f82' }}>
                    Create your first trustless contract and let AI verify milestone completion automatically.
                  </p>
                  <Link href="/new" className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Create First Contract
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map(p => {
                    const cfg = statusCfg[p.escrow_status] ?? statusCfg.Created;
                    return (
                      <Link key={p.id} href={`/project/${p.id}`}
                        className="glass-card glass-card-hover flex items-center justify-between px-5 py-4 block">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(218,119,86,0.1)', border: '1px solid rgba(218,119,86,0.2)' }}>
                            <ShieldCheck className="w-4 h-4" style={{ color: '#DA7756' }} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-sm" style={{ color: '#F5ECD7' }}>{p.title}</h3>
                              {p.github_url && (
                                <span className="text-xs px-2 py-0.5 rounded font-mono"
                                  style={{ background: '#1c1917', border: '1px solid #2e2b26', color: '#9a8f82' }}>
                                  <GitBranch className="w-2.5 h-2.5 inline mr-1" />
                                  {p.github_url.replace('https://github.com/', '')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs line-clamp-1 mb-1.5" style={{ color: '#9a8f82' }}>{p.description}</p>
                            <div className="flex items-center gap-4">
                              <span className={cfg.cls}>{cfg.label}</span>
                              <span className="text-xs font-mono" style={{ color: '#5a5248' }}>
                                <Coins className="w-3.5 h-3.5 inline mr-1" />
                                {p.escrow_amount} MON
                              </span>
                              <span className="text-xs" style={{ color: '#5a5248' }}>
                                {new Date(p.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0" style={{ color: '#5a5248' }}>›</div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: On-Chain Transaction Feed */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#5a5248' }}>
                <FileCode className="w-3.5 h-3.5" style={{ color: '#67e8f9' }} /> Monad Ledger Logs
              </h2>

              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="glass-card h-12 shimmer" />)}
                </div>
              ) : transactions.length === 0 ? (
                <div className="glass-card p-8 text-center text-xs font-mono" style={{ color: '#5a5248' }}>
                  No transaction events emitted yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {transactions.map(tx => (
                    <div key={tx.hash} className="glass-card p-3 font-mono text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-bold">{tx.method}</span>
                        <span className="text-green-400 font-bold">+{tx.value} MON</span>
                      </div>
                      <div className="flex justify-between" style={{ color: '#5a5248' }}>
                        <span>Block: {tx.blockNumber}</span>
                        <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="truncate text-xxs flex justify-between gap-2 pt-1" style={{ borderTop: '1px solid #1c1917' }}>
                        <span className="truncate" style={{ color: '#9a8f82' }}>Hash: {tx.hash.substring(0, 16)}...</span>
                        <span className="text-cyan-500 hover:underline cursor-pointer">Explorer ↗</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer status strip */}
          <div className="flex justify-between items-center text-xs font-mono px-4 py-2.5 rounded-md"
            style={{ background: '#141210', border: '1px solid #201e1b', color: '#5a5248' }}>
            <span>contracts: <span style={{ color: '#DA7756' }}>{projects.length}</span></span>
            <span>network: <span style={{ color: '#4ade80' }}>Monad Devnet</span></span>
            <span>engine: <span style={{ color: '#67e8f9' }}>trustless-ai-v1</span></span>
          </div>

        </div>
      </main>
    </div>
  );
}
