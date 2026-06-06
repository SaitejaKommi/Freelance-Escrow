// ─────────────────────────────────────────────
// Milestone Agent — converts evidence to completion scores
// ─────────────────────────────────────────────
import type { MilestoneOutput, MilestoneScore, MilestoneEvidence } from '@/lib/types';
import { askLLM } from './llm';

export async function runMilestoneAgent(
  milestones: { title: string; weight: number }[],
  evidence:   Record<string, MilestoneEvidence>,
): Promise<MilestoneOutput> {

  const systemPrompt = `You are a software quality assessor. For each milestone, analyze the provided evidence (files and commits) and assign:
1. "completion": an integer from 0 to 100 representing implementation completion.
2. "status": "Completed" (if completion >= 81), "Partial" (if 21-80), or "Not Started" (if 0-20).
3. "reasoning": detailed explanation of what code exists and what is missing.

Input format:
Milestone: "Auth (weight: 20)"
Evidence files: ["src/auth/login.ts"]
Evidence commits: ["a1b2c3d feat: auth routes"]

Return ONLY a JSON object with this exact shape:
{
  "scores": {
    "Milestone Title": {
      "completion": 95,
      "status": "Completed" | "Partial" | "Not Started",
      "reasoning": "Detailed audit assessment."
    }
  }
}`;

  const userPrompt = `Milestones and Evidence:
${milestones.map(m => {
  const proof = evidence[m.title] || { files: [], commits: [], status: 'missing' };
  return `- Milestone: "${m.title} (weight: ${m.weight})"\n  Files: ${JSON.stringify(proof.files)}\n  Commits: ${JSON.stringify(proof.commits)}`;
}).join('\n')}`;

  try {
    const raw = await askLLM(userPrompt, systemPrompt, true);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.scores) {
        const milestoneScores: MilestoneScore[] = milestones.map(m => {
          const match = parsed.scores[m.title] || { completion: 0, status: 'Not Started', reasoning: 'No LLM score generated.' };
          const completion = Math.min(100, Math.max(0, Number(match.completion) || 0));
          let status: MilestoneScore['status'] = 'Not Started';
          if (completion >= 81) status = 'Completed';
          else if (completion >= 21) status = 'Partial';

          return {
            title: m.title,
            completion,
            status,
            reasoning: match.reasoning || 'Audit evaluation complete.',
          };
        });

        const completed = milestoneScores.filter(s => s.status === 'Completed').length;
        const partial   = milestoneScores.filter(s => s.status === 'Partial').length;
        const missing   = milestoneScores.filter(s => s.status === 'Not Started').length;

        return {
          status: 'success',
          milestoneScores,
          reasoning: `Scored ${milestones.length} milestones: ${completed} Completed, ${partial} Partial, ${missing} Not Started.`,
        };
      }
    }
  } catch { /* fallback */ }

  // ── Heuristic fallback if LLM is unavailable or fails ──
  const milestoneScores: MilestoneScore[] = milestones.map(m => {
    const proof = evidence[m.title];
    let completion = 0;
    let status: MilestoneScore['status'] = 'Not Started';
    let reasoning = 'No evidence evaluated.';

    if (proof) {
      switch (proof.status) {
        case 'completed':
          completion = 95;
          status = 'Completed';
          reasoning = `${proof.files.length} verified files and ${proof.commits.length} commits confirm full implementation.`;
          break;
        case 'partial':
          completion = 50;
          status = 'Partial';
          reasoning = `${proof.files.length} files found but not all requirements are met. ${proof.commits.length} related commits.`;
          break;
        case 'missing':
          completion = 5;
          status = 'Not Started';
          reasoning = "No repository artifacts matched this milestone's criteria.";
          break;
        default:
          completion = 0;
          status = 'Not Started';
          reasoning = 'Insufficient data to evaluate milestone.';
      }
    }

    return { title: m.title, completion, status, reasoning };
  });

  const completed = milestoneScores.filter(s => s.status === 'Completed').length;
  const partial   = milestoneScores.filter(s => s.status === 'Partial').length;
  const missing   = milestoneScores.filter(s => s.status === 'Not Started').length;

  return {
    status:         'success',
    milestoneScores,
    reasoning:      `Scored ${milestones.length} milestones via fallback heuristic: ${completed} Completed, ${partial} Partial, ${missing} Not Started.`,
  };
}
