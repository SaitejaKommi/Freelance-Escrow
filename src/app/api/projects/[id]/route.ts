import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await db.getProjectById(id);
    if (!project) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const [milestones, repository, reviews, payouts] = await Promise.all([
      db.getMilestones(id),
      db.getRepository(id),
      db.getReviews(id),
      db.getPayouts(id),
    ]);

    return NextResponse.json({ success: true, data: { project, milestones, repository, reviews, payouts } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await _req.json();
    const project = await db.updateProject(id, body);
    if (!project) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: project });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
