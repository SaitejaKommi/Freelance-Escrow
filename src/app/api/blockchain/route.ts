import { NextResponse } from 'next/server';
import { blockchain } from '@/lib/blockchain';

export async function GET() {
  try {
    const [transactions, balances] = await Promise.all([
      blockchain.getTransactions(),
      blockchain.getBalances(),
    ]);
    return NextResponse.json({ success: true, data: { transactions, balances } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
