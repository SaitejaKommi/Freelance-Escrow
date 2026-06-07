import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EscrowModule = buildModule("EscrowModule", (m) => {
  // Use Account #0 as the Arbiter
  const arbiter = m.getAccount(0);

  const escrow = m.contract("FreelanceEscrow", [arbiter]);

  return { escrow };
});

export default EscrowModule;
