import { NextResponse } from 'next/server';
import { db }              from '@/lib/db';
import { runPlannerAgent } from '@/lib/agents/planner';
import { blockchain }      from '@/lib/blockchain';

export async function GET() {
  try {
    const projects = await db.getProjects();
    return NextResponse.json({ success: true, data: projects });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, escrow_amount, github_url } = body;
    if (!title || !description)
      return NextResponse.json({ success: false, error: 'title and description are required' }, { status: 400 });

    const amount = parseFloat(escrow_amount ?? '0') || 0;

    const project = await db.createProject({
      title, description,
      client_id:     'client-demo',
      escrow_amount: amount,
      escrow_status: amount > 0 ? 'Funded' : 'Created',
      github_url:    github_url ?? '',
    });

    // Execute Monad contract deposit
    if (amount > 0) {
      await blockchain.deposit(project.id, amount);
    }

    // Auto-generate milestones via Planner Agent
    const plan = await runPlannerAgent(description);
    if (plan.status === 'success') {
      await db.createMilestones(project.id, plan.milestones.map(m => ({ ...m, completion: 0, status: 'Not Started' as const })));
    }

    // Persist repo link
    if (github_url) {
      await db.upsertRepository(project.id, github_url);
    }

    return NextResponse.json({ success: true, data: { project, milestones: plan.milestones } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
