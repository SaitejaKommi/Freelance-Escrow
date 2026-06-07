'use client';
import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Loader2, CheckCircle, GitBranch, FileCode, GitCommit, AlertTriangle } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import type { Project, Milestone, Review, Payout } from '@/lib/types';

type PageData = { project: Project; milestones: Milestone[]; repository: any; reviews: Review[]; payouts: Payout[] };

function fmt$(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function scoreColor(s: number) { return s === 0 ? '#33334a' : s >= 80 ? '#22c55e' : s >= 50 ? '#7B68EE' : '#f59e0b'; }

function renderMarkdown(md: string) {
  if (!md) return '';
  
  // Basic escaping for safety while allowing HTML tags we generate
  let text = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Inline formatting: code and bold
  text = text.replace(/`(.*?)`/g, '<code class="md-code">$1</code>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="md-strong">$1</strong>');
  
  const lines = text.split('\n');
  const processed: string[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (!tableHeaders.length) return '';
    let tableHtml = '<div class="md-table-container"><table class="md-table"><thead><tr>';
    tableHeaders.forEach(h => {
      tableHtml += `<th>${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    tableRows.forEach(row => {
      tableHtml += '<tr>';
      row.forEach(cell => {
        tableHtml += `<td>${cell}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    inTable = false;
    tableHeaders = [];
    tableRows = [];
    return tableHtml;
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Check for tables
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Divider line
      if (line.includes('---')) {
        continue;
      }
      
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      if (inTable) {
        processed.push(flushTable());
      }
    }

    // Headers
    if (line.startsWith('# ')) {
      processed.push(`<h1 class="md-h1">${line.slice(2)}</h1>`);
    } else if (line.startsWith('## ')) {
      processed.push(`<h2 class="md-h2">${line.slice(3)}</h2>`);
    } else if (line.startsWith('### ')) {
      processed.push(`<h3 class="md-h3">${line.slice(4)}</h3>`);
    } else if (line.startsWith('#### ')) {
      processed.push(`<h4 class="md-h3" style="color: var(--vl); font-size: 13px; margin-top: 14px; margin-bottom: 6px;">${line.slice(5)}</h4>`);
    } else if (line.startsWith('##### ')) {
      processed.push(`<h5 class="md-h3" style="color: var(--i1); font-size: 12px; margin-top: 12px; margin-bottom: 4px;">${line.slice(6)}</h5>`);
    } else if (line.startsWith('###### ')) {
      processed.push(`<h6 class="md-h3" style="color: var(--i2); font-size: 11px; margin-top: 10px; margin-bottom: 4px;">${line.slice(7)}</h6>`);
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      processed.push(`<blockquote class="md-blockquote">${line.slice(2)}</blockquote>`);
    }
    // Horizontal rule
    else if (line === '---') {
      processed.push('<hr class="md-hr" />');
    }
    // Bullet list
    else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ')) {
      const content = line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ') ? line.slice(2) : line;
      processed.push(`<li class="md-li">${content}</li>`);
    }
    // Numbered list
    else if (/^\d+\.\s+(.*)/.test(line)) {
      const match = line.match(/^\d+\.\s+(.*)/);
      processed.push(`<li class="md-li" style="list-style-type: decimal;">${match ? match[1] : line}</li>`);
    }
    // Empty line
    else if (line === '') {
      // Just ignore or separate with normal line spacing
    }
    // Normal line
    else {
      processed.push(`<p style="margin-bottom: 8px;">${line}</p>`);
    }
  }

  if (inTable) {
    processed.push(flushTable());
  }

  return processed.join('\n');
}



function ScoreRing({ score, size = 70 }: { score: number; size?: number }) {
  const sw = 4, r = (size - sw * 2) / 2, circ = 2 * Math.PI * r;
  const color = scoreColor(score);
  const ref = useRef<SVGCircleElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const dash = (score / 100) * circ;
    setTimeout(() => { if (ref.current) ref.current.style.strokeDasharray = `${dash} ${circ}`; }, 80);
  }, [score, circ]);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
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

const msBadge: Record<string, { cls: string; label: string }> = {
  'Completed':       { cls: 'badge badge-green',  label: 'Verified'  },
  'Mostly Complete': { cls: 'badge badge-purple', label: 'Partial'   },
  'Partial':         { cls: 'badge badge-amber',  label: 'Partial'   },
  'Not Started':     { cls: 'badge badge-gray',   label: 'Pending'   },
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data,          setData]          = useState<PageData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [auditing,      setAuditing]      = useState(false);
  const [selectedMs,    setSelectedMs]    = useState(0);
  const [parsedEvidence,setParsedEvidence]= useState<Record<string, any>>({});
  const [releasingId,   setReleasingId]   = useState<string | null>(null);
  const [reportView,    setReportView]    = useState<'client'|'technical'>('client');

  async function fetchData() {
    const r = await fetch(`/api/projects/${id}`);
    const d = await r.json();
    if (!d.success) return;
    setData(d.data);
    if (d.data.reviews?.length > 0) {
      try { setParsedEvidence(JSON.parse(d.data.reviews[0].evidence ?? '{}')); } catch {}
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [id]);

  async function triggerAudit() {
    if (!data?.project || !data?.repository) return;
    setAuditing(true);
    window.location.href = `/visualizer?projectId=${id}&run=1`;
  }

  async function handlePayout(payoutId: string, action: 'approve'|'refund') {
    setReleasingId(payoutId);
    try {
      const res = await fetch('/api/payout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payoutId, action }) });
      if (res.ok) {
        if (action === 'approve') {
          const { default: confetti } = await import('canvas-confetti');
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
        fetchData();
      }
    } finally { setReleasingId(null); }
  }

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--i3)' }}>
          <Loader2 className="spin" style={{ width: 18, height: 18, color: 'var(--v)' }} />
          <span style={{ fontSize: 14 }}>Loading contract…</span>
        </div>
      </main>
    </div>
  );

  if (!data) return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle style={{ width: 32, height: 32, color: 'var(--ro)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--i1)', marginBottom: 16 }}>Contract not found</p>
          <Link href="/" className="btn-ghost">← Back to Dashboard</Link>
        </div>
      </main>
    </div>
  );

  const { project, milestones, repository, reviews, payouts } = data;
  const latestReview = reviews[0] ?? null;
  const pendingPayouts = payouts.filter(p => p.status === 'Pending');
  const ms = milestones[selectedMs] ?? milestones[0];
  const done    = milestones.filter(m => m.status === 'Completed').length;
  const partial = milestones.filter(m => m.status === 'Partial' || m.status === 'Mostly Complete').length;
  const pending = milestones.filter(m => m.status === 'Not Started').length;
  const overallCompletion = milestones.length > 0
    ? Math.round(milestones.reduce((s, m) => s + m.completion, 0) / milestones.length)
    : 0;

  // Parse report
  const summaryRaw = latestReview?.summary ?? '';
  const [technicalReport, clientTranslation] = summaryRaw.includes('\n---CLIENT_TRANSLATION---\n')
    ? summaryRaw.split('\n---CLIENT_TRANSLATION---\n')
    : [summaryRaw, ''];

  // Parse milestone description
  const descParts = ms?.description?.split('\n---TECHNICAL_FEATURES---\n') ?? ['', ''];
  const clientDesc = descParts[0] ?? '';
  const techFeats = descParts[1] ?? '';

  // Evidence for selected milestone
  const evKey = ms ? Object.keys(parsedEvidence).find(k =>
    k.toLowerCase().replace(/\s/g,'').includes(ms.title.toLowerCase().replace(/\s/g,'').slice(0,8))
    || ms.title.toLowerCase().replace(/\s/g,'').includes(k.toLowerCase().replace(/\s/g,'').slice(0,8))
  ) ?? null : null;
  const ev = evKey ? parsedEvidence[evKey] : null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/" className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
              <ArrowLeft style={{ width: 13, height: 13 }} /> Dashboard
            </Link>
            <span style={{ color: 'var(--i4)', fontSize: 12 }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--i2)', fontWeight: 500 }}>{project.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              id="trigger-audit-btn"
              onClick={triggerAudit}
              disabled={auditing || !repository}
              className="btn-primary"
              style={{ padding: '9px 20px', boxShadow: '0 0 20px rgba(123,104,238,0.3)' }}
            >
              {auditing
                ? <><Loader2 className="spin" style={{ width: 14, height: 14 }} /> Analyzing…</>
                : <><Play style={{ width: 13, height: 13 }} /> Run AI Audit</>}
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>

          {/* Project header card */}
          <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--i4)', letterSpacing: '0.07em' }}>ESCROW CONTRACT</span>
                  <span className={`badge ${project.escrow_status === 'Released' ? 'badge-green' : project.escrow_status === 'Funded' ? 'badge-purple' : 'badge-gray'}`}>
                    <span className="badge-dot" /> {project.escrow_status}
                  </span>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6, color: 'var(--i1)' }}>
                  {project.title}
                </h1>
                <p style={{ fontSize: 13, color: 'var(--i3)', lineHeight: 1.6, marginBottom: 18 }}>
                  {project.description}
                </p>
                {repository && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--vl)', marginBottom: 18 }}>
                    <GitBranch style={{ width: 12, height: 12 }} />
                    <a href={repository.github_url} target="_blank" rel="noreferrer"
                      className="font-mono" style={{ color: 'var(--vl)', textDecoration: 'none' }}>
                      {repository.owner}/{repository.repo}
                    </a>
                  </div>
                )}
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    { l: 'Escrow Amount', v: fmt$(project.escrow_amount), c: 'var(--i1)' },
                    { l: 'Audit Score',   v: latestReview ? `${latestReview.score}%` : '—', c: latestReview ? scoreColor(latestReview.score) : 'var(--i4)' },
                    { l: 'Milestones',    v: `${done} / ${milestones.length}`, c: 'var(--em)' },
                  ].map(({ l, v, c }) => (
                    <div key={l} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 9, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: 9, color: 'var(--i4)', marginBottom: 4, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>{l.toUpperCase()}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScoreRing score={overallCompletion} size={88} />
                <div style={{ fontSize: 10, color: 'var(--i4)', marginTop: 7 }}>Overall Progress</div>
                <div className="prog-track" style={{ marginTop: 7, width: 88 }}>
                  <div className="prog-fill" style={{ width: `${overallCompletion}%`, background: 'linear-gradient(90deg, var(--v), var(--teal))' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Payouts */}
          {pendingPayouts.map(payout => (
            <div key={payout.id} className="card animate-slide-up" style={{ padding: '18px 22px', marginBottom: 16, borderColor: 'rgba(34,197,94,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>💸</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--i1)' }}>AI Settlement Recommendation</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--i3)' }}>
                    Release <strong style={{ color: 'var(--em)' }}>{fmt$(payout.amount)}</strong>
                    {' '}({payout.release_percentage}% of escrow) based on verified milestones
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button id={`refund-${payout.id}`} onClick={() => handlePayout(payout.id, 'refund')}
                    disabled={!!releasingId} className="btn-dispute" style={{ padding: '8px 16px', flex: 'none' }}>
                    {releasingId === payout.id ? <Loader2 className="spin" style={{ width: 13 }} /> : 'Refund'}
                  </button>
                  <button id={`approve-${payout.id}`} onClick={() => handlePayout(payout.id, 'approve')}
                    disabled={!!releasingId} className="btn-release" style={{ padding: '10px 22px', flex: 'none', fontWeight: 700, fontSize: 14 }}>
                    {releasingId === payout.id
                      ? <Loader2 className="spin" style={{ width: 14 }} />
                      : <><CheckCircle style={{ width: 15 }} /> Approve & Release {fmt$(payout.amount)}</>}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Main detail grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

            {/* Left: Milestone list */}
            <div style={{ position: 'sticky', top: '10px', height: 'fit-content', alignSelf: 'start' }}>
              <div className="sect-label">MILESTONES · {milestones.length} TOTAL</div>

              {/* Summary counters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                {[
                  { l: 'Done',    v: done,    c: 'var(--em)' },
                  { l: 'Partial', v: partial, c: 'var(--am)' },
                  { l: 'Pending', v: pending, c: 'var(--i4)' },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ background: 'var(--bg2)', border: '1px solid var(--b)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: c, marginBottom: 2 }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'var(--i4)' }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Milestone rows */}
              {milestones.map((m, i) => {
                const active = i === selectedMs;
                const sc = scoreColor(m.completion);
                const dp = m.description?.split('\n---TECHNICAL_FEATURES---\n') ?? [''];
                return (
                  <button key={m.id} className={`ms-row${active ? ' active' : ''}`} onClick={() => setSelectedMs(i)}>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--i4)', width: 20, flexShrink: 0 }}>
                      M{i+1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--i1)' : 'var(--i2)', marginBottom: m.completion > 0 ? 4 : 0, letterSpacing: '-0.01em' }}>
                        {m.title}
                      </div>
                      {m.completion > 0 && (
                        <div className="prog-track">
                          <div className="prog-fill" style={{ width: `${m.completion}%`, background: sc }} />
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--i1)' }}>{fmt$(m.weight)}</div>
                      <div className="font-mono" style={{ fontSize: 10, color: sc }}>{m.completion > 0 ? `${m.completion}%` : '—'}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Verification panel */}
            <div>
              <div className="sect-label">VERIFICATION PANEL</div>
              {ms ? (
                <div style={{ background: 'var(--bg1)', border: '1px solid var(--b)', borderRadius: 20, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ background: `linear-gradient(135deg, ${scoreColor(ms.completion)}12, transparent)`, borderBottom: '1px solid var(--b)', padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div className="font-mono" style={{ fontSize: 9, color: 'var(--i4)', letterSpacing: '0.1em', marginBottom: 7 }}>
                          AI VERIFICATION REPORT
                        </div>
                        <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 9 }}>{ms.title}</h2>
                        <span className={msBadge[ms.status]?.cls ?? 'badge badge-gray'}>
                          <span className="badge-dot" /> {msBadge[ms.status]?.label ?? ms.status}
                        </span>
                      </div>
                      <ScoreRing score={ms.completion} size={70} />
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      {[['Description', clientDesc || '—'], ['Weight', `${ms.weight}%`]].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ fontSize: 9, color: 'var(--i4)', marginBottom: 3, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>{l.toUpperCase()}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--i2)' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical features (if any) */}
                  {techFeats && (
                    <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="font-mono" style={{ fontSize: 9, color: 'var(--i4)', letterSpacing: '0.1em', marginBottom: 8 }}>EXPECTED FEATURES</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {techFeats.split(',').map((f, i) => (
                          <span key={i} className="evidence-tag" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'var(--b)', color: 'var(--i3)' }}>
                            {f.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence from audit */}
                  {ev && (
                    <>
                      {ev.files?.length > 0 && (
                        <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div className="font-mono" style={{ fontSize: 9, color: 'var(--i4)', letterSpacing: '0.1em', marginBottom: 8 }}>REPOSITORY EVIDENCE</div>
                          {ev.files.slice(0, 6).map((f: string) => (
                            <span key={f} className="evidence-tag">📄 {f}</span>
                          ))}
                        </div>
                      )}
                      {ev.reasoning && (
                        <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div className="font-mono" style={{ fontSize: 9, color: 'var(--vl)', letterSpacing: '0.1em', marginBottom: 8 }}>🤖 AI VERDICT</div>
                          <p style={{ fontSize: 13, color: 'var(--i2)', lineHeight: 1.75 }}>{ev.reasoning}</p>
                        </div>
                      )}
                    </>
                  )}

                  {!ev && ms.completion === 0 && (
                    <div style={{ padding: 28, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Not yet verified</div>
                      <div style={{ fontSize: 12, color: 'var(--i4)' }}>Run AI Audit to analyze this milestone</div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ padding: '16px 22px' }}>
                    <button id="trigger-audit-btn-panel" onClick={triggerAudit}
                      disabled={auditing || !repository} className="btn-audit">
                      {auditing
                        ? <><Loader2 className="spin" style={{ width: 14 }} /> Analyzing repository…</>
                        : <>▶ Run AI Verification</>}
                    </button>
                    {ms.completion > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button className="btn-release" onClick={() => {}}>
                          💸 Release {fmt$(Math.round(project.escrow_amount * ms.weight / 100 * ms.completion / 100))}
                        </button>
                        <button className="btn-dispute">⚖️ Open Dispute</button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--i4)' }}>
                  No milestones yet. Run AI Audit to generate them.
                </div>
              )}

              {/* Full audit report */}
              {latestReview && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {(['client', 'technical'] as const).map(v => (
                      <button key={v} onClick={() => setReportView(v)}
                        style={{
                          padding: '5px 14px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                          background: reportView === v ? 'var(--vx)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${reportView === v ? 'var(--vb)' : 'var(--b)'}`,
                          color: reportView === v ? 'var(--vl)' : 'var(--i3)',
                          fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em',
                          fontWeight: reportView === v ? 600 : 400,
                        }}>
                        {v === 'client' ? 'CLIENT REPORT' : 'TECHNICAL REPORT'}
                      </button>
                    ))}
                  </div>
                  <div className="card" style={{ padding: '24px 30px' }}>
                    <div 
                      style={{ fontSize: 13, color: 'var(--i2)', lineHeight: 1.8 }}
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(
                          reportView === 'client' ? (clientTranslation || technicalReport) : technicalReport
                        )
                      }}
                    />
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
