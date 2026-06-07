import { createWalletClient, custom, parseEther, createPublicClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';

import { ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS  } from './contractABI';

export async function connectWallet() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const walletClient = createWalletClient({
    chain: monadTestnet,
    transport: custom(window.ethereum)
  });

  const [address] = await walletClient.requestAddresses();

  return { walletClient, address };
}

export async function depositToEscrow(projectId: string, amountEth: number) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const { walletClient, address } = await connectWallet();
  const publicClient = createPublicClient({
    chain:  monadTestnet,
    transport: custom(window.ethereum)
  });

  const amountWei = parseEther(amountEth.toString());

  const { request } = await publicClient.simulateContract({
    account: address,
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_CONTRACT_ABI,
    functionName: 'deposit',
    args: [projectId],
    value: amountWei,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return { hash, receipt };
}
