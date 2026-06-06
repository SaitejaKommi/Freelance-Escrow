// ─────────────────────────────────────────────
// Orchestrator — sequential multi-agent pipeline
// ─────────────────────────────────────────────
import { db }                 from '@/lib/db';
import { runGithubAgent }     from './github';
import { runEvidenceAgent }   from './evidence';
import { runMilestoneAgent }  from './milestone';
import { runPaymentAgent }    from './payment';
import { runReportAgent }     from './report';
import type { PipelineState, AgentLog, AgentName } from '@/lib/types';

// ── In-process run registry ─────────────────────────────────────────────────
const registry = new Map<string, PipelineState>();

export function getPipelineState(projectId: string): PipelineState | undefined {
  return registry.get(projectId);
}

export async function startPipeline(
  projectId:    string,
  githubUrl:    string,
  escrowAmount: number,
): Promise<PipelineState> {

  // Idempotent: don't restart if already running
  const existing = registry.get(projectId);
  if (existing?.status === 'running') return existing;

  const project    = await db.getProjectById(projectId);
  const milestones = await db.getMilestones(projectId);
  if (!project)              throw new Error('Project not found');
  if (!milestones.length)    throw new Error('No milestones for this project');

  const state: PipelineState = {
    projectId,
    status:    'running',
    logs:      [],
    startedAt: new Date().toISOString(),
  };
  registry.set(projectId, state);

  // ── Helper to append a log entry ──────────────────────────────────────────
  const log = (agent: AgentName, message: string, type: AgentLog['type'] = 'info', payload?: unknown) => {
    state.logs.push({ timestamp: new Date().toISOString(), agent, message, type, payload });
  };
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // ── Run asynchronously so the API can return the initial state immediately ─
  (async () => {
    try {
      // ── Stage 1: GitHub ──────────────────────────────────────────────────
      state.currentAgent = 'github';
      log('github', `Connecting to repository: ${githubUrl}`);
      await sleep(1200);
      const ghResult = await runGithubAgent(githubUrl, milestones);
      state.githubResult = ghResult;
      log('github', `Repository scanned — ${ghResult.files.length} files, ${ghResult.commits.length} commits, ${ghResult.pullRequests.length} PRs. Stack: ${ghResult.technologies.join(', ')}.`, 'success', { files: ghResult.files.length, commits: ghResult.commits.length, prs: ghResult.pullRequests.length });
      await sleep(800);

      // ── Stage 2: Evidence ────────────────────────────────────────────────
      state.currentAgent = 'evidence';
      log('evidence', 'Mapping repository artifacts to project milestones…');
      await sleep(1400);
      const evResult = await runEvidenceAgent(milestones, ghResult.files, ghResult.commits);
      state.evidenceResult = evResult;
      log('evidence', `Evidence analysis done. Confidence: ${evResult.confidence}%.`, 'success', evResult.evidence);
      await sleep(800);

      // ── Stage 3: Milestone ───────────────────────────────────────────────
      state.currentAgent = 'milestone';
      log('milestone', 'Scoring completion percentage for each milestone…');
      await sleep(1200);
      const msResult = await runMilestoneAgent(milestones, evResult.evidence);
      state.milestoneResult = msResult;

      // Persist scores to DB
      for (const score of msResult.milestoneScores) {
        const m = milestones.find(x => x.title === score.title);
        if (m) await db.updateMilestone(m.id, { completion: score.completion, status: score.status as any });
      }
      log('milestone', msResult.reasoning, 'success', msResult.milestoneScores.map(s => ({ title: s.title, completion: s.completion, status: s.status })));
      await sleep(800);

      // ── Stage 4: Payment ─────────────────────────────────────────────────
      state.currentAgent = 'payment';
      log('payment', `Computing payout from ${escrowAmount} MON escrow pool…`);
      await sleep(1000);
      const pyResult = await runPaymentAgent(milestones, msResult.milestoneScores, escrowAmount, evResult.confidence);
      state.paymentResult = pyResult;
      log('payment', `Settlement: ${pyResult.completionPercentage}% complete → recommend releasing ${pyResult.recommendedRelease} MON.`, 'success', { completionPercentage: pyResult.completionPercentage, recommendedRelease: pyResult.recommendedRelease });
      await sleep(800);

      // ── Stage 5: Report ──────────────────────────────────────────────────
      state.currentAgent = 'report';
      log('report', 'Compiling audit report…');
      await sleep(1000);
      const rpResult = await runReportAgent(
        project.title,
        pyResult.completionPercentage,
        escrowAmount,
        pyResult.recommendedRelease,
        pyResult.confidence,
        msResult.milestoneScores,
        evResult.evidence,
      );
      state.reportResult = rpResult;
      log('report', rpResult.summary, 'success');
      await sleep(600);

      // ── Persist Review + Payout ──────────────────────────────────────────
      await db.createReview(projectId, {
        score:      pyResult.completionPercentage,
        confidence: pyResult.confidence,
        summary:    rpResult.markdownReport,
        evidence:   JSON.stringify(evResult.evidence),
      });

      if (pyResult.recommendedRelease > 0) {
        await db.createPayout(projectId, {
          amount:             pyResult.recommendedRelease,
          release_percentage: pyResult.completionPercentage,
          status:             'Pending',
        });
      }

      await db.updateProject(projectId, { updated_at: new Date().toISOString() });

      state.status       = 'completed';
      state.currentAgent = undefined;
      state.completedAt  = new Date().toISOString();
      log('report', '✦ Pipeline completed. Payout recommendation ready for client approval.', 'success');

    } catch (err: any) {
      state.status       = 'failed';
      state.currentAgent = undefined;
      log(state.currentAgent ?? 'report', `Pipeline error: ${err.message ?? 'Unknown failure'}`, 'error');
    }
  })();

  return state;
}
