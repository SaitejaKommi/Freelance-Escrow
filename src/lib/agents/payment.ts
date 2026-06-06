// ─────────────────────────────────────────────
// Payment Agent — computes weighted payout recommendation
// ─────────────────────────────────────────────
import type { PaymentOutput, MilestoneScore } from '@/lib/types';
import { askLLM } from './llm';

export async function runPaymentAgent(
  milestones:      { title: string; weight: number }[],
  milestoneScores: MilestoneScore[],
  escrowAmount:    number,
  confidence:      number,
): Promise<PaymentOutput> {

  let weighted = 0;
  let totalW   = 0;

  for (const m of milestones) {
    const score = milestoneScores.find(s => s.title === m.title);
    weighted += (score?.completion ?? 0) * m.weight;
    totalW   += m.weight;
  }

  const completionPct      = totalW > 0 ? Math.round(weighted / totalW) : 0;
  const recommendedRelease = Math.round((escrowAmount * completionPct) / 100 * 100) / 100;

  const systemPrompt = `You are a financial arbitrator for a decentralized software escrow.
Your task is to write a highly professional payment release justification statement based on milestone completions.
Return ONLY a JSON object with this exact shape:
{
  "reasoning": "A professional paragraph justifying the release of X tokens (Y% completion) out of Z total escrow."
}`;

  const userPrompt = `Escrow: ${escrowAmount} MON
Completion: ${completionPct}%
Recommended Release: ${recommendedRelease} MON
Milestone Progress:
${milestoneScores.map(s => `- ${s.title}: ${s.completion}% completed (${s.status})`).join('\n')}`;

  let reasoning = '';
  try {
    const raw = await askLLM(userPrompt, systemPrompt, true);
    if (raw) {
      const parsed = JSON.parse(raw);
      reasoning = parsed.reasoning || '';
    }
  } catch { /* fallback */ }

  if (!reasoning) {
    if (completionPct >= 90) {
      reasoning = `Project is ${completionPct}% complete — all major milestones satisfied. Recommend releasing the full balance of ${recommendedRelease} MON.`;
    } else if (completionPct > 0) {
      reasoning = `Project is ${completionPct}% complete. Recommend a partial release of ${recommendedRelease} MON (${completionPct}% of ${escrowAmount} MON). Remaining ${(escrowAmount - recommendedRelease).toFixed(2)} MON stays locked until further milestones are completed.`;
    } else {
      reasoning = `No verifiable progress detected. Recommend keeping the full ${escrowAmount} MON locked in escrow.`;
    }
  }

  return {
    status:               'success',
    completionPercentage: completionPct,
    escrowAmount,
    recommendedRelease,
    confidence:           Math.round(confidence),
    reasoning,
  };
}
