// ─────────────────────────────────────────────
// Planner Agent — converts requirements to milestones
// ─────────────────────────────────────────────
import type { PlannerOutput, PlannedMilestone } from '@/lib/types';
import { askLLM } from './llm';

export async function runPlannerAgent(description: string): Promise<PlannerOutput> {
  const systemPrompt = `You are a technical project planner. Decompose the user's project requirements into 3 to 5 logical milestones.
Each milestone must have a "title", "description", and an integer "weight".
The weights of all milestones MUST sum to exactly 100.
Return ONLY a JSON object with this exact shape:
{
  "milestones": [
    { "title": "Auth", "description": "...", "weight": 20 }
  ],
  "reasoning": "Explain the decomposition briefly"
}`;

  const userPrompt = `Decompose this project description:\n"${description}"`;

  try {
    const raw = await askLLM(userPrompt, systemPrompt, true);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
        // Normalize weights to sum to 100
        const milestones: PlannedMilestone[] = parsed.milestones.map((m: any) => ({
          title: String(m.title),
          description: String(m.description),
          weight: Math.round(Number(m.weight)) || 10,
        }));
        const total = milestones.reduce((s, m) => s + m.weight, 0);
        let running = 0;
        milestones.forEach((m, idx) => {
          if (idx === milestones.length - 1) {
            m.weight = 100 - running;
          } else {
            m.weight = Math.round((m.weight * 100) / total);
            running += m.weight;
          }
        });
        return {
          status: 'success',
          milestones,
          reasoning: parsed.reasoning || 'Successfully decomposed specifications via AI Planner.',
        };
      }
    }
  } catch { /* fallback */ }

  // ── Heuristic fallback if LLM is unavailable or fails ──
  const d = description.toLowerCase();
  const milestones: PlannedMilestone[] = [];

  if (d.includes('auth') || d.includes('login') || d.includes('signup') || d.includes('user')) {
    milestones.push({ title: 'User Authentication', description: 'Signup, login, JWT/session management, password hashing, protected routes.', weight: 20 });
  }
  if (d.includes('dashboard') || d.includes('panel') || d.includes('home')) {
    milestones.push({ title: 'Dashboard Interface', description: 'Main application shell: responsive layout, navigation sidebar, stat cards.', weight: 20 });
  }
  if (d.includes('task') || d.includes('crud') || d.includes('create') || d.includes('delete') || d.includes('edit')) {
    milestones.push({ title: 'Core CRUD Operations', description: 'Create, read, update, delete records with API endpoints and UI forms.', weight: 30 });
  } else if (d.includes('wallet') || d.includes('web3') || d.includes('contract') || d.includes('token')) {
    milestones.push({ title: 'Web3 Wallet Integration', description: 'Connect wallet, read contract state, sign and broadcast transactions.', weight: 30 });
  } else if (d.includes('api') || d.includes('endpoint') || d.includes('backend') || d.includes('service')) {
    milestones.push({ title: 'API Service Layer', description: 'REST/GraphQL endpoints, data models, validation, error handling.', weight: 30 });
  }
  if (d.includes('search') || d.includes('filter') || d.includes('query')) {
    milestones.push({ title: 'Search & Filter', description: 'Full-text search, filter by tag/status/date, pagination.', weight: 15 });
  }
  if (d.includes('responsive') || d.includes('mobile') || d.includes('design') || d.includes('ui') || d.includes('ux')) {
    milestones.push({ title: 'Responsive Design & Polish', description: 'Mobile-first layouts, accessibility, micro-animations, dark mode.', weight: 15 });
  }

  // Fallback
  if (milestones.length === 0) {
    milestones.push(
      { title: 'Project Setup & Architecture',    description: 'Repository scaffolding, TypeScript config, CI/CD pipeline.', weight: 25 },
      { title: 'Core Feature Implementation',     description: 'Primary business logic, data models, user flows.',           weight: 50 },
      { title: 'Testing & Quality Assurance',     description: 'Unit tests, integration tests, error handling.',              weight: 25 },
    );
  }

  // Normalize weights to 100
  const total = milestones.reduce((s, m) => s + m.weight, 0);
  let running = 0;
  milestones.forEach((m, i) => {
    if (i === milestones.length - 1) { m.weight = 100 - running; }
    else { m.weight = Math.round(m.weight * 100 / total); running += m.weight; }
  });

  return {
    status: 'success',
    milestones,
    reasoning: `Extracted ${milestones.length} milestones from requirements spec via heuristic planner fallback. Weights normalized to Σ=100.`,
  };
}
