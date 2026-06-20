I now have comprehensive, cited coverage across all four voice options, both coordination primitives, and the difficulty assessment. Compiling the deliverable.

---

## Scope

Research voice + generative-UI integration for the DeepBook Predict AI-agent web app, with the hard requirement: when voice is active and a generative-UI component appears (confirm-and-sign card / wallet signature), the voice must **pause / coordinate** with the UI interaction, then resume. Covers (a) current voice options and how each does tool-calling + UI, (b) the pause-for-genUI/signing coordination pattern, (c) concrete references, (d) honest difficulty + cleanest approach + v1-vs-stretch verdict. Web app = user signs in their browser-extension wallet via Sui dapp-kit; the local CLI/MCP setup is out of scope for the voice signing flow.

## Sources Checked

- OpenAI Realtime API — Realtime conversations guide (developers.openai.com/api/docs/guides/realtime-conversations); gpt-realtime announcement (openai.com/index/introducing-gpt-realtime); Latent Space "Realtime API: The Missing Manual" (latent.space/p/realtime-api).
- OpenAI Agents SDK (TypeScript) — Building Voice Agents (openai.github.io/openai-agents-js/guides/voice-agents/build); Human-in-the-loop (openai.github.io/openai-agents-js/guides/human-in-the-loop); community announcement of RealtimeAgent (community.openai.com/t/.../1277152).
- Vercel AI SDK — AI SDK 5 blog (vercel.com/blog/ai-sdk-5); AI Voice Elements changelog (vercel.com/changelog/ai-voice-elements); Context7 `/vercel/ai`, `/websites/ai-sdk_dev_cookbook`.
- ElevenLabs Conversational AI / Agents — client-tools doc (elevenlabs.io/docs/eleven-agents/customization/tools/client-tools); React SDK doc + npm `@elevenlabs/react`, `@elevenlabs/client`; ElevenLabs UI (Context7 `/elevenlabs/ui`, `/websites/npmjs_package_elevenlabs_react`).
- Pipecat — RTVI standard + reference-server docs; client-js/client-react npm; GitHub issue #1735 (function-call result return).
- npm versions verified (see below). Sui dapp-kit `@mysten/dapp-kit` for the web signing side.

## Verified Facts

**Current versions (npm view, 2026-06-19):** `@elevenlabs/react` 1.7.0, `@elevenlabs/client` 1.12.0, `ai` (Vercel) 6.0.208, `@openai/agents` 0.11.8, `@openai/agents-realtime` 0.11.8, `@pipecat-ai/client-js` 1.12.0, `@mysten/dapp-kit` 1.1.1.

### (a) Voice options and how each surfaces tool calls / UI

**OpenAI Realtime API (speech-to-speech, one WebSocket/WebRTC).** Collapses ASR+LLM+TTS into one connection. Tool-calling event flow (from the Realtime conversations guide): the model emits `response.function_call_arguments.delta` (streaming args) and the full call arrives in `response.done` with `output[0].type === "function_call"`, `.name`, `.arguments` (JSON string), and `.call_id`. Your client executes the tool, then sends `conversation.item.create` with type `function_call_output` (matching `call_id`, `output` as a JSON string), then `response.create` to resume. **It surfaces tool calls as client-side events, not pre-built UI** — you render the UI yourself. To stop the model speaking: `response.cancel` (and `conversation.item.truncate` with `audio_end_ms` for WebSocket playback, or `output_audio_buffer.clear` for WebRTC). The WebSocket transport does **not** implement muting — you must pause your own audio capture (stop calling `sendAudio()`).

**OpenAI Agents SDK for TypeScript — `RealtimeAgent`** (`@openai/agents-realtime`). This is the higher-level wrapper around Realtime and is the most relevant OpenAI-native primitive for your problem. Key facts:
- Tools can be defined with `needsApproval: true`; the agent then emits a `tool_approval_requested` event and **the tool call does not execute** — the run pauses and returns pending approvals in `result.interruptions`. You resolve with `result.state.approve(interruption)` / `.reject(interruption)` and resume. This is a built-in human-in-the-loop pause primitive.
- `session.mute(true|false)` toggles mic capture and `session.muted` reports state — but `OpenAIRealtimeWebSocket` returns `null` and `mute()` throws, so on WebSocket you pause capture yourself (WebRTC supports it).
- Emits `audio_interrupted` and tool/guardrail events you can hook for UI.

**Vercel AI SDK (transcription + TTS).** AI SDK 5/6 gives a unified, provider-swappable interface for **speech generation and transcription** (`experimental_transcribe`, `experimental_generateSpeech` / "Speech" + "Transcription" functions), plus **AI Voice Elements** UI components (Persona, SpeechInput, Transcription, AudioPlayer, MicSelector, VoiceSelector). **Critical:** these are STT/TTS building blocks + presentation components — the SDK does **not** ship a real-time speech-to-speech loop, interruption handling, or turn-taking (confirmed on the AI Voice Elements changelog: "designed to work with the Transcription and Speech functions"). However, the AI SDK is the **strongest at generative UI + tool-calling for the text/chat path** (`tool()`, streaming tool inputs, `useChat`, render-component-per-tool-result). So with AI SDK you'd be assembling the voice loop yourself around its STT/TTS.

**ElevenLabs Conversational AI / Agents (`@elevenlabs/react`, `@elevenlabs/client`).** Managed full speech-to-speech agent. Tool-calling via **client tools**: register functions the agent invokes on the browser. The doc explicitly states the agent receives the returned data and uses it as conversation context, and you must enable the **"Wait for response"** toggle in the tool config for the agent to wait for the return value. Client-tool handlers can be **async** (JS example: `getCustomerDetails: async () => {...}`). React SDK exposes `useConversation` (with `onConnect`/`onDisconnect`/`onMessage`/`onError`, and `clientTools`), plus newer split hooks `useConversationStatus` (`status`), `useConversationControls` (`startSession`/`endSession`), and `useConversationClientTool(name, handler)` for registering a tool from a component with auto-cleanup. `startSession` supports `connectionType: "webrtc" | "websocket"` and `overrides`. **This is the only option where "the agent waits for a frontend tool's async return" is a first-class, documented feature** — which is exactly the pause-for-signature primitive. ElevenLabs also ships an open-source **ElevenLabs UI** component library (shadcn-based: Orb, waveform, Conversation Bar, message components) for the chrome.

**Pipecat (open-source, self-hosted).** RTVI standard separates a Python server pipeline from JS/React clients (`@pipecat-ai/client-js`, `client-react`). Function calls can be forwarded to the client via `rtvi_processor.handle_function_call(...)`, handled in the client's `handleFunctionCall` callback, and the returned result is sent back to the LLM (GitHub issue #1735 confirms the round-trip). RTVI function-call event detail is configurable (DISABLED/NONE/NAME/FULL). Most control and least managed infra — best if you want to self-host and own the pipeline, heaviest lift for a hackathon.

**Which surface tool results as UI events:** ElevenLabs (client tools → your React handler renders UI, async return resumes agent) and OpenAI Agents-SDK RealtimeAgent (`tool_approval_requested` / tool events) surface tool calls as events you turn into UI. Vercel AI SDK surfaces tool calls as UI in the **text** path (true generative UI) but has no native voice loop. None of them auto-render a "sign transaction" card — you always build that component; the SDK just gives you the event + the wait primitive.

### (b) The coordination pattern (pause TTS → render card → wait for signature → resume)

The pattern that every option converges on is **a frontend/client tool whose handler returns a Promise that you do not resolve until the user finishes the UI interaction.** Concretely:

1. Agent decides to act → calls a client/frontend tool, e.g. `placePrediction({ market, side, size })`.
2. Your tool handler: (a) stop/pause the voice — ElevenLabs: the agent naturally goes quiet waiting for the tool return when "Wait for response" is on; OpenAI Realtime: `response.cancel` + pause `sendAudio()`; Agents SDK: `session.mute(true)` / `needsApproval`. (b) render the confirm-and-sign genUI card.
3. The handler `await`s a Promise that resolves from the card's `onConfirm`/`onCancel`. The wallet signature itself is already promise-based — Sui dapp-kit's `useSignAndExecuteTransaction` / `signTransaction` returns a Promise that resolves on user approval in the extension. So the tool handler effectively does `const result = await signAndExecute(tx)`.
4. Return the signature/digest (or "user rejected") from the tool. The agent appends it to context and **resumes speaking** ("Done — your YES position at 0.62 is filled, digest 0x…").

This is the documented `onConfirm`-resolves-the-Promise dialog pattern (VueUse `useConfirmDialog`, rms-vue3-confirm-dialog show the generic primitive) applied to a voice tool handler. For **OpenAI Agents SDK** specifically, the cleaner native variant is `needsApproval: true` → `tool_approval_requested` pauses the run → render card → `result.state.approve()/reject()` → resume — no manual Promise juggling, the SDK persists/serializes state across the pause. For **ElevenLabs**, the cleaner native variant is "client tool with Wait for response + async handler returning a Promise resolved by the wallet flow."

### (c) Concrete references

- ElevenLabs **client tools** doc (function executes on client, agent receives returned data, "Wait for response" toggle, async JS handler): elevenlabs.io/docs/eleven-agents/customization/tools/client-tools.
- ElevenLabs **React SDK** + `useConversationClientTool` (register tool from a component, type-safe, auto-cleanup): elevenlabs.io/docs/agents-platform/libraries/react; npm `@elevenlabs/react`.
- ElevenLabs **UI** voice-chat block (real `useConversation` with `onMessage`, `startSession` connectionType/overrides): github.com/elevenlabs/ui (registry/elevenlabs-ui/blocks/voice-chat-01).
- OpenAI Agents SDK **Human-in-the-loop** (`needsApproval`, `tool_approval_requested`, `result.interruptions`, `state.approve/reject`): openai.github.io/openai-agents-js/guides/human-in-the-loop; **Building Voice Agents** (`session.mute`, audio interruption, WebSocket-no-mute caveat): openai.github.io/openai-agents-js/guides/voice-agents/build.
- OpenAI **Realtime conversations** (function-call event flow, `response.cancel`, truncate): developers.openai.com/api/docs/guides/realtime-conversations.
- Vercel **AI SDK 5** (unified speech/transcription, tool streaming) vercel.com/blog/ai-sdk-5; **AI Voice Elements** vercel.com/changelog/ai-voice-elements; **Human-in-the-loop cookbook** (text path) ai-sdk.dev/cookbook/next/human-in-the-loop.
- Pipecat RTVI client function-call round-trip: github.com/pipecat-ai/pipecat/issues/1735; docs.pipecat.ai/client/rtvi-standard.

### (d) Difficulty + cleanest approach + v1-vs-stretch

**Honest difficulty: MEDIUM, and lower than the user expects** — specifically *because* the wallet must be signed in the browser. The hard part of voice+genUI is "make the model stop talking and yield to the UI." A wallet signature is the *ideal* genUI interaction for this because the wallet extension already imposes a synchronous, promise-based, user-blocking modal. You don't have to fight the voice loop to hold attention — the signature flow naturally creates the gap, and the tool handler just `await`s the existing dapp-kit promise. The genuinely fiddly parts are: (1) preventing the voice from talking over the wallet modal (handled by the wait-for-tool-response semantics + mute), (2) handling user-rejection/timeout gracefully (return a "rejected" result so the agent recovers verbally), and (3) barge-in/echo (the model hearing its own TTS) — but that's solved inside the managed agents, not your code.

**Cleanest approach for this dapp:** Use **ElevenLabs Conversational AI** for the voice layer with **client tools (Wait for response = on)**, and inside the read-only/quote tools render generative-UI cards (market card, odds, position preview) via the AI SDK / your shared tool registry. For the **write/sign** tool, the client-tool handler renders the confirm-and-sign card and `await`s Sui **dapp-kit** `useSignAndExecuteTransaction`; on resolve it returns the digest, the agent resumes. This gives you the wait-for-signature pause *for free* and the least custom plumbing. If you prefer staying OpenAI-native (one provider, tighter control, traces), use the **OpenAI Agents SDK `RealtimeAgent`** with `needsApproval: true` on the sign tool — the `tool_approval_requested` interruption is a purpose-built pause-for-UI primitive and the SDK serializes state across the gap. Either way, **the tools that build unsigned txs and render cards are the same shared registry** you already use for MCP/CLI/web — voice just adds one more consumer that calls the same tool and renders the same card.

**v1 vs stretch:** Make a **clear split.** v1 headline = **generative UI + tool-calling in the text/chat path** (Vercel AI SDK is the star here, sign card via dapp-kit) — this is the demo-winning surface and is fully controllable. **Voice = a stretch / "wow" add-on layered on the same tool registry**, scoped to: (i) voice for read-only queries and quotes (low risk, high demo value), and (ii) voice-initiated trade that hands off to the *same* confirm-and-sign card with the wallet doing the blocking. Do **not** make voice a hard dependency of the trade path for v1 — keep the canonical sign flow click-driven, and let voice route into it. This protects the headline while letting you show the voice+genUI+signature coordination as the showcase moment.

## Inferences

- ElevenLabs is the lowest-effort path to the exact "pause for signature" behavior because "agent waits for an async client-tool return" is a documented first-class feature; I infer (not explicitly documented) that the response-timeout could cut off a slow human signature — verify the "Wait for response" timeout and set it generously, or return immediately and have the agent re-query status. (Unknown below.)
- OpenAI Agents SDK `needsApproval` is conceptually a perfect fit, but its examples are oriented to the non-realtime runner (`runner.run` + `result.state`); the realtime pause-and-resume ergonomics with `RealtimeSession` are less documented — budget spike time before committing.
- For barge-in correctness during the sign modal, mute the mic while the wallet extension is focused so the model doesn't transcribe ambient speech as a new turn; both managed agents support this but it's app-wiring you must add.

## Unknowns And Questions

1. **ElevenLabs client-tool response timeout** for a human-in-the-loop wait — the public doc confirms "Wait for response" but does not state a default/max timeout. Needs a /tmp spike to confirm a multi-second wallet signature won't time the tool out (the WebFetch and Context7 both lacked an explicit number).
2. **OpenAI `RealtimeAgent` + `needsApproval` realtime ergonomics** — whether approve/reject + resume works as smoothly mid-conversation as in the non-realtime runner. Not confirmed in the build guide excerpt; spike before relying on it.
3. **Echo/barge-in handling during the wallet modal** across WebRTC vs WebSocket transports — confirmed WebSocket has no native mute (you pause capture); WebRTC mute behavior with a focused extension popup is untested here.
4. Whether the user wants voice as a *single provider* (favors OpenAI Agents SDK end-to-end) or is fine mixing ElevenLabs voice + AI SDK genUI (favors ElevenLabs for the wait primitive) — this is a product decision, not a fact I can resolve.

Relevant absolute path for follow-up spikes: `/tmp` (per HARD RULES; do not touch `/Users/abu/dev/hackathon/sui-overflow/onemem` or the deepbook-predict-agent folder).