# <p align="center"><img src="public/file.svg" width="36" height="36" valign="middle" style="margin-right: 10px;" /> krow — AI-Verified Freelance Escrow</p>

<p align="center">
  <img src="https://img.shields.io/badge/Built_On-Monad-8A2BE2?style=for-the-badge" alt="Monad" />
  <img src="https://img.shields.io/badge/Powered_By-Groq_Llama_3.3-orange?style=for-the-badge" alt="Groq" />
  <img src="https://img.shields.io/badge/Framework-Next.js_14-black?style=for-the-badge" alt="Next.js" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

---

**krow** is a next-generation decentralized freelance platform built on the high-performance **Monad** blockchain. It eliminates subjectivity, payment disputes, and manual reviews by leveraging a **6-Agent AI Orchestra** to verify developer deliverables directly from GitHub commits and pull requests. If the code matches the requirements, the smart contract automatically releases the escrowed funds.

---

## 📌 Table of Contents
- [⚙️ Tech Stack](#️-tech-stack)
- [🔄 System Flow Architecture](#-system-flow-architecture)
- [🤖 The AI Agent Orchestra](#-the-ai-agent-orchestra)
- [📦 Project Structure](#-project-structure)
- [🚀 Local Installation & Setup](#-local-installation--setup)
- [🧑‍💻 Code Verification Deep Dive](#-code-verification-deep-dive)
- [🛡️ Verification Fallback Strategy](#️-verification-fallback-strategy)

---

## ⚙️ Tech Stack

- **L1 Blockchain:** Monad Devnet (Simulated smart contract state & wallets using custom `localStorage` layer).
- **AI Engine:** Groq SDK (`llama-3.3-70b-versatile`) with automated API fallback redundancy.
- **Frontend / Fullstack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Client/Chain Interaction:** Viem, Wagmi.

---

## 🔄 System Flow Architecture

```mermaid
graph TD
    A[Client Creates Project] -->|Locks MON in Escrow| B(Monad Smart Contract)
    A -->|Defines Requirements| C[Milestones Set]
    D[Developer Builds Code] -->|Opens PR / Pushes Commits| E[GitHub Repository]
    E --> F[Trigger krow Verification Engine]
    
    subgraph AI Orchestra Pipeline
        F --> G[1. GitHub Agent: Scan paths & diffs]
        G --> H[2. Evidence Agent: Semantic matching]
        H --> I[3. Milestone Agent: Analyze file contents]
        I --> J[4. Verify Agent: Cross-check requirements]
        J --> K[5. Report Agent: Compile audit logs]
        K --> L[6. Payment Agent: Resolve escrow releases]
    end

    L -->|Release Verdict| M{Verdict Approved?}
    M -->|Yes (Score >= 80%)| N[Release Funds Automatically]
    M -->|No| O[Hold Funds / Request Re-review]
    N -->|Call contract function| B
```

---

## 🤖 The AI Agent Orchestra

The core strength of krow is its sequential multi-agent orchestration. Each agent handles a specific step of the audit process:

| Agent Name | Role | Primary Responsibility | Key Output Metric |
| :--- | :--- | :--- | :--- |
| **GitHub Agent** | Repo Scanner | Discovers files, PR details, technologies, and commit counts. | File inventory & Tech list |
| **Evidence Agent** | Semantic Mapper | Maps files and commits to project milestones (lenient matching). | Relevant file mapping |
| **Milestone Agent** | Code Auditor | Scores milestone completion based on actual code snippets. | Completion score (0–100%) |
| **Verify Agent** | Quality Auditor | Cross-checks quality, error handling, and boilerplate code. | Compliance rating |
| **Report Agent** | Audit Compiler | Drafts final Markdown report and client-friendly translations. | Multi-page audit summary |
| **Payment Agent** | Escrow Settler | Calculates release ratios and recommended Monad payout. | Released MON amount |

---

## 📦 Project Structure

```bash
├── public/                     # Static media and logo SVGs
└── src/
    ├── app/
    │   ├── api/                # API routes for verification and projects
    │   ├── dashboard/          # Freelancer/Client dashboard view
    │   ├── visualizer/         # Live 6-Agent pipeline execution screen
    │   ├── page.tsx            # High-impact pitch deck landing page
    │   └── layout.tsx          # App providers and main structure
    ├── components/
    │   ├── ThemeToggle.tsx     # Theme switcher
    │   ├── Sidebar.tsx         # Dashboard sidebar navigator
    │   └── ui.tsx              # Reusable premium UI components
    └── lib/
        ├── agents/             # The 6 Agent files + LLM/Orchestrator
        ├── blockchain.ts       # Monad local client simulation wrapper
        ├── db.ts               # LocalStorage mock database manager
        └── types.ts            # Type definitions
```

---

## 🚀 Local Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Durgaprasad-Developer/Freelance-Escrow.git
   cd Freelance-Escrow
   ```

2. **Install Project Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key
   # Fallback keys (optional but recommended)
   NVIDIA_API_KEY=your_nvidia_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Launch Local Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧑‍💻 Code Verification Deep Dive

When code is submitted, the **Milestone Agent** parses up to **3,000 characters** of the matched files. It flags empty placeholders, stubs, and mocks:

```typescript
// Example of code analyzed by the Milestone Agent
export async function runMilestoneAgent(
  milestones: Milestone[],
  evidence: Record<string, MilestoneEvidence>,
  fileContents: Record<string, string>
) {
  // Evaluates actual logic complexity vs boilerplates
  const systemPrompt = `Analyze actual code contents for real work vs placeholders...`;
  const response = await askLLM(userPrompt, systemPrompt, true);
  return JSON.parse(response);
}
```

---

## 🛡️ Verification Fallback Strategy

To ensure high uptime during presentations and live hackathon demos, `src/lib/agents/llm.ts` utilizes a cascading failover loop:

```
[Groq (Llama 3.3)] ──(fails)──> [NVIDIA NIM (Llama 3.3)] ──(fails)──> [Gemini (1.5 Flash)]
```

If all API keys are missing or rate-limited, krow automatically invokes a deterministic regex-heuristic fallback engine to ensure the live demo completes smoothly.

---
<p align="center">Built with 💜 for the Monad Hackathon 2025</p>
