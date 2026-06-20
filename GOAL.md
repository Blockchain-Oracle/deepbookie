# GOAL — DeepBook Predict Agent

**An AI agent that lets anyone trade DeepBook Predict by talking to it — and you sign every trade in your own wallet. The agent never holds a key or touches your funds.**

DeepBook Predict = a fast, expiry-based **prediction market** on Sui (bet BTC above/below a price within a sub-hour window), priced from a real options-style **vol surface** (SVI). Live on testnet.

## What we build (LOCKED — do not re-litigate)
**One shared tool registry** (the agent's "abilities") reused across four surfaces:
1. **Local MCP** — works in Cursor / Claude Code / any agent; signs with a **local wallet**.
2. **CLI** — terminal access to the same tools.
3. **Agent skill** — the "how to trade Predict" playbook.
4. **Generative-UI web app** — a chat-to-sign dapp where tools render as real widgets (odds curve, payoff, vault) and you sign with your **connected browser wallet** (dapp-kit). Plus a **landing page**.

The tools build **unsigned** Sui transactions (PTBs); **each surface signs its own way** — local key for the MCP/CLI, browser wallet for the web. Same tool core, two signers.

## Hard rules
- **NOT an SDK-for-other-developers.** mPilot over-built an SDK around the tools and got abandoned — do not repeat it. One flat tool registry, thin adapters (portaldot-mcp pattern).
- **Modern stack only** — current MCP SDK + transports, current Vercel AI SDK generative UI (not deprecated `streamUI`/RSC), current dapp-kit. See `research/` references.
- **Track anchor:** Sui Overflow 2026 **DeepBook Predict** track ($35k 1st). Minimum to qualify: integrate the Predict contract on testnet, end-to-end. Judging: 50% real-world / 20% UX / 20% technical / 10% presentation.
- The **web app is the headline** (wins the 50% + 20%); MCP/CLI/skill is the first-of-kind "any agent can now trade Predict" durability layer.
- Build in a **new repo here** (`deepbook-predict-agent`) — never inside the sibling `onemem` project.
