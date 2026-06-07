import { createPublicClient, createWalletClient, http, formatEther, parseEther } from 'viem';
import { monadTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS } from './contractABI';
import type { BlockchainTx } from '@/lib/types';

// Use Hardhat Account #0 as Arbiter for backend transactions
const ARBITER_PRIVATE_KEY = "0xb18c4b6c3ad7eb9c01a3b71d3d52a0224ddb84d9232882961ec379b418d31681";
const arbiterAccount = privateKeyToAccount(ARBITER_PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account: arbiterAccount,
  chain: monadTestnet,
  transport: http(),
});

export const blockchain = {
  async getTransactions(): Promise<BlockchainTx[]> {
    try {
      const blockNumber = await publicClient.getBlockNumber();
      const logs = await publicClient.getLogs({
        address: ESCROW_CONTRACT_ADDRESS,
        fromBlock: blockNumber > 90n ? blockNumber - 90n : 0n,
        toBlock: blockNumber,
      });

      const txs = await Promise.all(logs.map(async (log) => {
        const tx = await publicClient.getTransaction({ hash: log.transactionHash! });
        const receipt = await publicClient.getTransactionReceipt({ hash: log.transactionHash! });
        return {
          hash: log.transactionHash!,
          blockNumber: Number(log.blockNumber),
          from: tx.from,
          to: tx.to || ESCROW_CONTRACT_ADDRESS,
          value: formatEther(tx.value),
          method: 'EscrowEvent', // Simplified mapping, could parse log topic
          status: receipt.status === 'success' ? 'success' : 'failed',
          timestamp: new Date().toISOString(),
          gasUsed: Number(receipt.gasUsed),
        } as BlockchainTx;
      }));
      return txs.reverse();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getBalances() {
    try {
      const balance = await publicClient.getBalance({ address: ESCROW_CONTRACT_ADDRESS });
      return {
        client: 1000,
        freelancer: 250,
        contract: Number(formatEther(balance))
      };
    } catch {
      return { client: 1000, freelancer: 250, contract: 0 };
    }
  },

  async release(projectId: string, amount: number, freelancerAddress: `0x${string}` = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'): Promise<BlockchainTx> {
    const { request } = await publicClient.simulateContract({
      account: arbiterAccount,
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_CONTRACT_ABI,
      functionName: 'release',
      args: [projectId, freelancerAddress],
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      blockNumber: Number(receipt.blockNumber),
      from: arbiterAccount.address,
      to: ESCROW_CONTRACT_ADDRESS,
      value: amount.toString(),
      method: 'release()',
      status: 'success',
      timestamp: new Date().toISOString(),
      gasUsed: Number(receipt.gasUsed),
    };
  },

  async refund(projectId: string, amount: number): Promise<BlockchainTx> {
    const { request } = await publicClient.simulateContract({
      account: arbiterAccount,
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_CONTRACT_ABI,
      functionName: 'refund',
      args: [projectId],
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      blockNumber: Number(receipt.blockNumber),
      from: arbiterAccount.address,
      to: ESCROW_CONTRACT_ADDRESS,
      value: amount.toString(),
      method: 'refund()',
      status: 'success',
      timestamp: new Date().toISOString(),
      gasUsed: Number(receipt.gasUsed),
    };
  },
};
