import fs from 'fs';
import path from 'path';
import type { Project, Milestone, Repository, Review, Payout } from '@/lib/types';

const DB_FILE = path.join(process.cwd(), 'src/lib/db.json');

function readDbFile(): Record<string, any[]> {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    /* ignore */
  }
  return {
    projects:     [],
    milestones:   [],
    repositories: [],
    reviews:      [],
    payouts:      [],
  };
}

function writeDbFile(data: Record<string, any[]>) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    /* ignore */
  }
}

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function now() { return new Date().toISOString(); }

function store<T>(key: string): T[] {
  if (typeof window === 'undefined') {
    const data = readDbFile();
    return (data[key] as T[]) ?? [];
  }
  try {
    return JSON.parse(localStorage.getItem('escrow_' + key) ?? '[]') as T[];
  } catch { return []; }
}

function persist<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') {
    const fullDb = readDbFile();
    fullDb[key] = data;
    writeDbFile(fullDb);
    return;
  }
  try { localStorage.setItem('escrow_' + key, JSON.stringify(data)); } catch { /* ignore */ }
}

let supabase: any = null;
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  } catch { /* supabase not installed yet */ }
}

// ── Unified DB API ─────────────────────────────────────────────────────────────
export const db = {

  // Projects ─────────────────────────────────────────────────────────────────
  async getProjects(): Promise<Project[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    return [...store<Project>('projects')].reverse();
  },

  async getProjectById(id: string): Promise<Project | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    return store<Project>('projects').find(p => p.id === id) ?? null;
  },

  async createProject(input: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const project: Project = { ...input, id: uid(), created_at: now(), updated_at: now() };
    if (supabase) {
      try {
        const { data, error } = await supabase.from('projects').insert(project).select().single();
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    const list = store<Project>('projects');
    list.push(project);
    persist('projects', list);
    return project;
  },

  async updateProject(id: string, patch: Partial<Project>): Promise<Project | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('projects').update({ ...patch, updated_at: now() }).eq('id', id).select().single();
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    const list = store<Project>('projects');
    const idx  = list.findIndex(p => p.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...patch, updated_at: now() };
    persist('projects', list);
    return list[idx];
  },

  // Milestones ────────────────────────────────────────────────────────────────
  async getMilestones(projectId: string): Promise<Milestone[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('milestones').select('*').eq('project_id', projectId);
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    return store<Milestone>('milestones').filter(m => m.project_id === projectId);
  },

  async createMilestones(projectId: string, items: Omit<Milestone, 'id' | 'project_id' | 'created_at' | 'updated_at'>[]): Promise<Milestone[]> {
    const newItems: Milestone[] = items.map(m => ({ ...m, id: uid(), project_id: projectId, created_at: now(), updated_at: now() }));
    if (supabase) {
      try {
        const { data, error } = await supabase.from('milestones').insert(newItems).select();
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    const list = store<Milestone>('milestones');
    list.push(...newItems);
    persist('milestones', list);
    return newItems;
  },

  async updateMilestone(id: string, patch: Partial<Milestone>): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase.from('milestones').update({ ...patch, updated_at: now() }).eq('id', id);
        if (!error) return;
      } catch { /* fallback */ }
    }
    const list = store<Milestone>('milestones');
    const idx  = list.findIndex(m => m.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...patch, updated_at: now() }; persist('milestones', list); }
  },

  // Repository ────────────────────────────────────────────────────────────────
  async getRepository(projectId: string): Promise<Repository | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('repositories').select('*').eq('project_id', projectId).single();
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    return store<Repository>('repositories').find(r => r.project_id === projectId) ?? null;
  },

  async upsertRepository(projectId: string, githubUrl: string): Promise<Repository> {
    let owner = 'owner', repo = 'repo';
    try {
      const parts = githubUrl.replace('https://github.com/', '').split('/');
      if (parts.length >= 2) { owner = parts[0]; repo = parts[1].replace('.git', ''); }
    } catch { /* ignore */ }

    const existing = await this.getRepository(projectId);
    const record: Repository = {
      id:          existing?.id ?? uid(),
      project_id:  projectId,
      github_url:  githubUrl,
      owner, repo,
      branch:      'main',
      created_at:  existing?.created_at ?? now(),
      updated_at:  now(),
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('repositories').upsert(record);
        if (!error) return record;
      } catch { /* fallback */ }
    }
    const list  = store<Repository>('repositories');
    const idx   = list.findIndex(r => r.project_id === projectId);
    if (idx >= 0) { list[idx] = record; } else { list.push(record); }
    persist('repositories', list);
    return record;
  },

  // Reviews ───────────────────────────────────────────────────────────────────
  async getReviews(projectId: string): Promise<Review[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('reviews').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    return store<Review>('reviews').filter(r => r.project_id === projectId).reverse();
  },

  async createReview(projectId: string, input: Omit<Review, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<Review> {
    const review: Review = { ...input, id: uid(), project_id: projectId, created_at: now(), updated_at: now() };
    if (supabase) {
      try {
        const { data, error } = await supabase.from('reviews').insert(review).select().single();
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    const list = store<Review>('reviews');
    list.push(review);
    persist('reviews', list);
    return review;
  },

  // Payouts ───────────────────────────────────────────────────────────────────
  async getPayouts(projectId: string): Promise<Payout[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('payouts').select('*').eq('project_id', projectId);
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    return store<Payout>('payouts').filter(p => p.project_id === projectId);
  },

  async getPayoutById(id: string): Promise<Payout | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('payouts').select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    return store<Payout>('payouts').find(p => p.id === id) ?? null;
  },

  async createPayout(projectId: string, input: Omit<Payout, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<Payout> {
    const payout: Payout = { ...input, id: uid(), project_id: projectId, created_at: now(), updated_at: now() };
    if (supabase) {
      try {
        const { data, error } = await supabase.from('payouts').insert(payout).select().single();
        if (!error && data) return data;
      } catch { /* fallback */ }
    }
    const list = store<Payout>('payouts');
    list.push(payout);
    persist('payouts', list);
    return payout;
  },

  async updatePayout(id: string, patch: Partial<Payout>): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase.from('payouts').update({ ...patch, updated_at: now() }).eq('id', id);
        if (!error) return;
      } catch { /* fallback */ }
    }
    const list = store<Payout>('payouts');
    const idx  = list.findIndex(p => p.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...patch, updated_at: now() }; persist('payouts', list); }
  }
};


