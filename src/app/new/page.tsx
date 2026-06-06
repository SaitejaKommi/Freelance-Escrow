'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Github, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function NewProject() {
  const router = useRouter();
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [escrowAmount, setEscrowAmount] = useState('1.0');
  const [githubUrl,    setGithubUrl]    = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

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
    finally   { setLoading(false); }
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#0e0c0a' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-7 py-4"
          style={{ background: 'rgba(14,12,10,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2e2b26' }}>
          <ShieldCheck className="w-5 h-5" style={{ color: '#DA7756' }} />
          <div>
            <h1 className="text-lg font-semibold" style={{ color: '#F5ECD7' }}>New Escrow Contract</h1>
            <p className="text-sm" style={{ color: '#5a5248' }}>AI Planner will auto-generate milestones from your requirements</p>
          </div>
        </div>

        <div className="px-7 py-6 max-w-2xl">

          {/* Code flavor */}
          <div className="code-flavor mb-6">
            <span className="cm">// AI parses your requirements →</span><br />
            <span className="kw">const</span> <span className="fn">milestones</span> = <span className="kw">await</span>{' '}
            <span className="fn">PlannerAgent</span>.<span className="fn">parse</span>(<span className="st">description</span>)
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: '#5a5248' }}>
                Project Title
              </label>
              <input id="project-title"
                type="text" required
                placeholder="e.g. Task Management Application"
                value={title} onChange={e => setTitle(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-md outline-none transition-all font-sans"
                style={{ background: '#141210', border: '1px solid #2e2b26', color: '#F5ECD7' }}
                onFocus={e => (e.target.style.borderColor = '#DA7756')}
                onBlur={e  => (e.target.style.borderColor = '#2e2b26')}
              />
            </div>

            {/* GitHub URL + Escrow row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: '#5a5248' }}>
                  GitHub Repository URL
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#5a5248' }} />
                  <input id="github-url"
                    type="url"
                    placeholder="https://github.com/user/repo"
                    value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                    className="w-full text-sm pl-9 pr-4 py-2.5 rounded-md outline-none transition-all font-mono"
                    style={{ background: '#141210', border: '1px solid #2e2b26', color: '#F5ECD7' }}
                    onFocus={e => (e.target.style.borderColor = '#DA7756')}
                    onBlur={e  => (e.target.style.borderColor = '#2e2b26')}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: '#5a5248' }}>
                  Escrow Amount (MON)
                </label>
                <input id="escrow-amount"
                  type="number" step="0.1" min="0.1" required
                  placeholder="1.0"
                  value={escrowAmount} onChange={e => setEscrowAmount(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-md outline-none transition-all font-mono"
                  style={{ background: '#141210', border: '1px solid #2e2b26', color: '#F5ECD7' }}
                  onFocus={e => (e.target.style.borderColor = '#DA7756')}
                  onBlur={e  => (e.target.style.borderColor = '#2e2b26')}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider" style={{ color: '#5a5248' }}>
                  Requirements & Milestones Spec
                </label>
                <span className="text-xs" style={{ color: '#5a5248' }}>// AI Planner reads this</span>
              </div>
              <textarea id="project-description"
                rows={5} required
                placeholder="Describe what the developer must build. E.g.: Must include user authentication (login, register, JWT), a responsive dashboard with navigation, and task CRUD operations with a database."
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-md outline-none transition-all font-sans resize-none"
                style={{ background: '#141210', border: '1px solid #2e2b26', color: '#F5ECD7' }}
                onFocus={e => (e.target.style.borderColor = '#DA7756')}
                onBlur={e  => (e.target.style.borderColor = '#2e2b26')}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#f87171' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button id="create-project-btn" type="submit" disabled={loading}
                className="btn-primary flex-1 justify-center py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Deploying...</> : <><Plus className="w-4 h-4" /> Deploy Escrow Contract</>}
              </button>
            </div>
          </form>

          {/* Info strip */}
          <div className="mt-6 code-flavor text-xs" style={{ borderLeftColor: '#67e8f9' }}>
            <span className="cm">// What happens next:</span><br />
            <span className="pu">1.</span> <span className="fn">PlannerAgent</span> decomposes your spec into milestones<br />
            <span className="pu">2.</span> Escrow funds are locked in simulated Monad contract<br />
            <span className="pu">3.</span> Run AI audit any time to verify progress <span className="cm">→ auto-recommend payout</span>
          </div>

        </div>
      </main>
    </div>
  );
}
