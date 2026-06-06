import { NextResponse } from 'next/server';
import { db }           from '@/lib/db';
import { blockchain }   from '@/lib/blockchain';

export async function POST(req: Request) {
  try {
    const { payoutId, action } = await req.json(); // action: 'approve' | 'refund'
    if (!payoutId || !action) return NextResponse.json({ success: false, error: 'payoutId and action required' }, { status: 400 });

    const payout = await db.getPayoutById(payoutId);
    if (!payout) return NextResponse.json({ success: false, error: 'Payout not found' }, { status: 404 });

    let tx;
    if (action === 'approve') {
      tx = await blockchain.release(payout.project_id, payout.amount);
    } else {
      tx = await blockchain.refund(payout.project_id, payout.amount);
    }

    const status = action === 'approve' ? 'Released' : 'Refunded';
    await db.updatePayout(payoutId, { status: status as any, tx_hash: tx.hash });

    // Also update project status if fully released or refunded
    if (action === 'approve') {
      await db.updateProject(payout.project_id, { escrow_status: 'Released' });
    } else {
      await db.updateProject(payout.project_id, { escrow_status: 'Refunded' });
    }

    return NextResponse.json({ success: true, data: { txHash: tx.hash, status } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
