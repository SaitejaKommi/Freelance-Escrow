// ─────────────────────────────────────────────
// Monad blockchain service — real + simulated ledger
// ─────────────────────────────────────────────
import type { BlockchainTx } from '@/lib/types';

const TXS_KEY = 'escrow_blockchain_txs';
const BAL_KEY = 'escrow_blockchain_balances';

function uid7() { return Math.random().toString(16).slice(2, 10); }
function txHash() { return '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''); }
function blockNum() { return 1_200_000 + Math.floor(Date.now() / 10_000); }

function loadTxs(): BlockchainTx[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(TXS_KEY) ?? '[]'); } catch { return []; }
}
function saveTxs(txs: BlockchainTx[]) {
  if (typeof window !== 'undefined') localStorage.setItem(TXS_KEY, JSON.stringify(txs));
}

function loadBalances() {
  if (typeof window === 'undefined') return { client: 1000, freelancer: 250, contract: 0 };
  try { return JSON.parse(localStorage.getItem(BAL_KEY) ?? 'null') ?? { client: 1000, freelancer: 250, contract: 0 }; } catch { return { client: 1000, freelancer: 250, contract: 0 }; }
}
function saveBalances(b: { client: number; freelancer: number; contract: number }) {
  if (typeof window !== 'undefined') localStorage.setItem(BAL_KEY, JSON.stringify(b));
}

export const blockchain = {
  async getTransactions(): Promise<BlockchainTx[]> {
    return [...loadTxs()].reverse();
  },

  async getBalances() {
    return loadBalances();
  },

  async deposit(projectId: string, amount: number): Promise<BlockchainTx> {
    const bal = loadBalances();
    const available = Math.min(amount, bal.client);
    bal.client   -= available;
    bal.contract += available;
    saveBalances(bal);

    const tx: BlockchainTx = {
      hash:        txHash(),
      blockNumber: blockNum(),
      from:        '0xClient…' + uid7(),
      to:          '0xEscrow…' + uid7(),
      value:       available.toFixed(2),
      method:      'depositFunds()',
      status:      'success',
      timestamp:   new Date().toISOString(),
      gasUsed:     Math.floor(Math.random() * 15000) + 21000,
    };
    const txs = loadTxs();
    txs.push(tx);
    saveTxs(txs);
    return tx;
  },

  async release(projectId: string, amount: number): Promise<BlockchainTx> {
    const bal = loadBalances();
    const available = Math.min(amount, bal.contract);
    bal.contract   -= available;
    bal.freelancer += available;
    saveBalances(bal);

    const tx: BlockchainTx = {
      hash:        txHash(),
      blockNumber: blockNum(),
      from:        '0xEscrow…' + uid7(),
      to:          '0xFreelancer…' + uid7(),
      value:       available.toFixed(2),
      method:      'releaseFunds()',
      status:      'success',
      timestamp:   new Date().toISOString(),
      gasUsed:     Math.floor(Math.random() * 12000) + 21000,
    };
    const txs = loadTxs();
    txs.push(tx);
    saveTxs(txs);
    return tx;
  },

  async refund(projectId: string, amount: number): Promise<BlockchainTx> {
    const bal = loadBalances();
    const available = Math.min(amount, bal.contract);
    bal.contract -= available;
    bal.client   += available;
    saveBalances(bal);

    const tx: BlockchainTx = {
      hash:        txHash(),
      blockNumber: blockNum(),
      from:        '0xEscrow…' + uid7(),
      to:          '0xClient…' + uid7(),
      value:       available.toFixed(2),
      method:      'refundFunds()',
      status:      'success',
      timestamp:   new Date().toISOString(),
      gasUsed:     Math.floor(Math.random() * 12000) + 21000,
    };
    const txs = loadTxs();
    txs.push(tx);
    saveTxs(txs);
    return tx;
  },
};
