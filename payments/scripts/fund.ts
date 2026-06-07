import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { hardhat } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

async function main() {
  // Hardhat Account #0
  const senderAccount = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"); 
  
  const walletClient = createWalletClient({
    account: senderAccount,
    chain: hardhat,
    transport: http("http://127.0.0.1:8545")
  });

  const publicClient = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545")
  });

  const toAddress = "0x6ce3ec3bfc429df1c142bA6bDAD8c3a7c246eF58";
  console.log(`Funding ${toAddress}...`);
  
  const hash = await walletClient.sendTransaction({
    to: toAddress as `0x${string}`,
    value: parseEther("1000"),
  });

  console.log(`Transaction sent: ${hash}`);
  await publicClient.waitForTransactionReceipt({ hash });
  
  const balance = await publicClient.getBalance({ address: toAddress as `0x${string}` });
  console.log(`Successfully sent 1000 ETH. New balance: ${balance}`);
}

main().catch(console.error);
