import { NextResponse }            from 'next/server';
import { startPipeline, getPipelineState } from '@/lib/agents/orchestrator';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ success: false, error: 'projectId required' }, { status: 400 });
  const state = getPipelineState(projectId);
  return NextResponse.json({ success: true, data: state ?? { status: 'idle', logs: [] } });
}

export async function POST(req: Request) {
  try {
    const { projectId, githubUrl, escrowAmount } = await req.json();
    if (!projectId || !githubUrl) return NextResponse.json({ success: false, error: 'projectId and githubUrl required' }, { status: 400 });
    const state = await startPipeline(projectId, githubUrl, parseFloat(escrowAmount ?? '0') || 0);
    return NextResponse.json({ success: true, data: state });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
