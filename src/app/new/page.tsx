'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Github, Loader2, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

// Derive preview milestones from typed description
function deriveMilestones(desc: string): string[] {
  if (!desc || desc.length < 15) return [];
  const rules: { key: RegExp; label: string }[] = [
    { key: /auth|login|signup|register|jwt|session|password/i, label: 'Authentication' },
    { key: /dashboard|overview|home|landing/i,                  label: 'Dashboard' },
    { key: /crud|create|read|update|delete|form|submit/i,       label: 'CRUD Operations' },
    { key: /api|endpoint|route|rest|backend|server/i,           label: 'API Layer' },
    { key: /ui|frontend|component|design|style|layout/i,        label: 'Frontend UI' },
    { key: /database|db|model|schema|storage|mongo|sql/i,       label: 'Database Setup' },
    { key: /test|spec|unit|integration|qa/i,                    label: 'Testing & QA' },
    { key: /report|analytics|chart|graph|stat/i,                label: 'Analytics & Reports' },
    { key: /search|filter|sort|query/i,                         label: 'Search & Filtering' },
    { key: /notif|email|sms|alert|push/i,                       label: 'Notifications' },
    { key: /payment|stripe|invoice|billing/i,                   label: 'Payment Integration' },
    { key: /deploy|docker|ci|cd|production/i,                   label: 'Deployment' },
  ];
  const found = rules.filter(r => r.key.test(desc)).map(r => r.label);
  if (found.length === 0) return ['Core Setup', 'Main Features', 'UI & Design', 'Testing & Launch'];
  return found.slice(0, 5);
}

export default function NewProject() {
  const router = useRouter();
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [escrowAmount, setEscrowAmount] = useState('1.0');
  const [githubUrl,    setGithubUrl]    = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [previewMs,    setPreviewMs]    = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setPreviewMs(deriveMilestones(description)), 350);
    return () => clearTimeout(t);
  }, [description]);

  const weightPer = previewMs.length > 0 ? Math.round(100 / previewMs.length) : 0;
  const msColors  = ['#7B68EE', '#18c8a8', '#22c55e', '#f59e0b', '#f87171'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, escrow_amount: escrowAmount, github_url: githubUrl }),
      });
      const d = await res.json();
      if (!d.success) { setError(d.error ?? 'Failed to create project'); return; }
      router.push(`/project/${d.data.project.id}`);
    } catch { setError('Network error. Try again.'); }
    finally { setLoading(false); }
  }

  const hasPreview = previewMs.length > 0;

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-4"
          style={{ background: 'rgba(8,8,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--b)' }}>
          <div className="flex items-center gap-3">
            <ShieldCheck style={{ width: 18, height: 18, color: 'var(--v)' }} />
            <div>
              <h1 className="text-base font-semibold" style={{ color: 'var(--i1)' }}>New Escrow Contract</h1>
              <p className="text-xs" style={{ color: 'var(--i3)' }}>Describe your project — AI will plan the milestones</p>
            </div>
          </div>
        </div>

        <div className="px-7 py-6">

          {/* Step indicator */}
          <div className="step-indicator">
            <div className="step-item active">
              <div className="step-num">1</div>
              <span>Describe Project</span>
            </div>
            <div className="step-connector" />
            <div className="step-item">
              <div className="step-num">2</div>
              <span>AI Plans Milestones</span>
            </div>
            <div className="step-connector" />
            <div className="step-item">
              <div className="step-num">3</div>
              <span>Run Audit</span>
            </div>
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

            {/* LEFT: Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Title */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--i3)' }}>Project Title</label>
                <input id="project-title" type="text" required
                  placeholder="e.g. Diabetes Tracking Platform"
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-lg outline-none font-sans"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--b)', color: 'var(--i1)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--v)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--b)')} />
              </div>

              {/* GitHub + Escrow */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--i3)' }}>GitHub Repository</label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--i4)' }} />
                    <input id="github-url" type="url"
                      placeholder="https://github.com/user/repo"
                      value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                      className="w-full text-sm pl-9 pr-4 py-2.5 rounded-lg outline-none font-mono"
                      style={{ background: 'var(--bg2)', border: '1px solid var(--b)', color: 'var(--i1)' }}
                      onFocus={e => (e.target.style.borderColor = 'var(--v)')}
                      onBlur={e  => (e.target.style.borderColor = 'var(--b)')} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--i3)' }}>Escrow Amount (MON)</label>
                  <input id="escrow-amount" type="number" step="0.1" min="0.1" required
                    placeholder="1.0"
                    value={escrowAmount} onChange={e => setEscrowAmount(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 rounded-lg outline-none font-mono"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--b)', color: 'var(--i1)' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--v)')}
                    onBlur={e  => (e.target.style.borderColor = 'var(--b)')} />
                </div>
              </div>

              {/* Requirements */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--i3)' }}>Project Requirements</label>
                  <span className="text-xs font-mono" style={{ color: 'var(--v)' }}>AI reads this →</span>
                </div>
                <textarea id="project-description" rows={7} required
                  placeholder={`Describe what must be built. Example:\n\n- User authentication with login and registration\n- Responsive dashboard with charts\n- CRUD operations for task management\n- REST API backend with database`}
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-lg outline-none font-sans resize-none"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--b)', color: 'var(--i1)', lineHeight: 1.7 }}
                  onFocus={e => (e.target.style.borderColor = 'var(--v)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--b)')} />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm" style={{ color: '#f87171' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              <button id="create-project-btn" type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-40">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating contract…</>
                  : <><Plus className="w-4 h-4" /> Create AI Escrow Contract</>}
              </button>
            </form>

            {/* RIGHT: Live Milestone Preview */}
            <div style={{ position: 'sticky', top: 80 }}>
              <div style={{ background: 'var(--bg1)', border: '1px solid var(--b)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles style={{ width: 15, height: 15, color: 'var(--v)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--i1)' }}>AI Will Generate</span>
                  {hasPreview && (
                    <span className="badge badge-purple" style={{ marginLeft: 'auto', fontSize: 9 }}>
                      {previewMs.length} milestones
                    </span>
                  )}
                </div>

                <div style={{ padding: '16px 20px' }}>
                  {!hasPreview ? (
                    <div style={{ textAlign: 'center', padding: '28px 0' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>✍️</div>
                      <p style={{ fontSize: 12, color: 'var(--i4)', lineHeight: 1.6 }}>
                        Start typing your requirements and the AI will preview the milestone plan here
                      </p>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: 11, color: 'var(--i4)', marginBottom: 12, fontFamily: 'DM Mono, monospace' }}>
                        Detected from your description:
                      </p>
                      {previewMs.map((ms, i) => (
                        <div key={ms} className="preview-ms-row animate-slide-up">
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: `${msColors[i % msColors.length]}18`, border: `1px solid ${msColors[i % msColors.length]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: msColors[i % msColors.length], fontFamily: 'DM Mono, monospace' }}>{i+1}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--i1)', marginBottom: 3 }}>{ms}</div>
                            <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                              <div className="shimmer" style={{ height: '100%', width: '60%', borderRadius: 1 }} />
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: msColors[i % msColors.length], fontFamily: 'DM Mono, monospace' }}>
                              {weightPer}%
                            </span>
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(123,104,238,0.06)', border: '1px solid rgba(123,104,238,0.18)', fontSize: 11, color: 'var(--i3)', lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--vl)', fontWeight: 600 }}>After creation:</span> AI will lock weights, connect to your GitHub repo, and run automated verification on each milestone.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
