# PromiseLedger — frontend

A frontend for the `PromiseLedger` Intelligent Contract deployed at
[`0x5FA7e3fA2ddE37F3cA7b61E1C89D9396a57E264e`](https://explorer-studio.genlayer.com/contracts/0x5FA7e3fA2ddE37F3cA7b61E1C89D9396a57E264e)
on **GenLayer Studionet** (the hosted Studio environment).

It lets anyone:

- browse the register of filed promises and their current verdict,
- **file a promise** with an evidence page — validators take a baseline
  snapshot immediately,
- **verify** a promise, which re-fetches the evidence, asks validators to
  judge FULFILLED / IN_PROGRESS / BROKEN / UNVERIFIABLE, and stores the
  verbatim citation the verdict was drawn from,
- **dispute** a report (a plain hash comparison: has the evidence page
  changed since the report was written?),
- and, as the original submitter, **repoint** a promise at a new evidence
  URL if three checks in a row failed to read the old one.

No backend — the app talks to the contract directly over `genlayer-js`,
reads work without a wallet, and writes go through whatever wallet you
connect (MetaMask or any injected EIP-1193 provider).

> **Studionet is a shared, hosted simulator, not a persistent testnet.**
> GenLayer can reset its state without notice, so don't rely on entries
> filed here surviving indefinitely. If you later redeploy the contract
> onto Bradbury or Asimov, see "Pointing this at a different deployment"
> below.

## Run it

```bash
npm install
npm run dev
```

Open the printed `localhost` URL. To write to the ledger (file, verify,
dispute, update an evidence link) you'll need:

1. An injected wallet (MetaMask works well) — the app will offer to add
   / switch it to **GenLayer Studio Network** (chain id `61999`) for you.
2. Some GEN on that same address. Studionet has no external faucet URL —
   open [studio.genlayer.com](https://studio.genlayer.com), pick (or
   import) the *same address* you connected here in its account selector,
   and use the faucet (💧) button there to fund it.

Reading the ledger (the list, an entry's history, stats) needs neither.

## Project layout

```
src/
  lib/
    chain.ts      network + contract address constants
    genlayer.ts    the genlayer-js client wrapper: reads, writes, wallet
                    chain-switching, and turning a failed on-chain
                    execution into a readable error message
    types.ts       TypeScript mirror of the contract's dataclasses
    rules.ts       client-side copies of the contract's own validation
                    rules (title/description length, https:// checks,
                    the verify cooldown) so a bad input never has to
                    round-trip through a wallet signature to be caught
    format.ts      date, address, and hash formatting helpers
  hooks/
    useWallet.tsx  wallet connection state (context)
    useToast.tsx   toast notifications (context)
    useNow.ts      a ticking clock, for live cooldown countdowns
  components/      Header, StatusSeal, LedgerEntry, ReportCard,
                    RegisterForm, UpdateEvidenceForm, …
  pages/
    LedgerPage.tsx the register: stats, "filed by you", the list itself
    CasePage.tsx   a single promise's case file + verification history
```

## Pointing this at a different deployment

The contract address is read from `VITE_CONTRACT_ADDRESS` if set, and
otherwise falls back to the address above (see `src/lib/chain.ts`). Copy
`.env.example` to `.env` and set it there if you deploy your own copy of
`promise_ledger.py`.

To move to a different GenLayer network (say, Bradbury or Asimov once
you deploy there for real), edit `src/lib/chain.ts`:

```ts
// swap this import + CHAIN assignment
import { testnetBradbury } from "genlayer-js/chains"; // was: studionet
export const CHAIN = testnetBradbury;
export const NETWORK_NAME = "testnetBradbury" as const;

// and these two — Bradbury/Asimov use /address/, Studio uses /contracts/
export const EXPLORER_BASE = "https://explorer-bradbury.genlayer.com";
export const CONTRACT_EXPLORER_URL = `${EXPLORER_BASE}/address/${CONTRACT_ADDRESS}`;
```
`genlayer-js/chains` also exports `localnet` and `testnetAsimov`.

## Build

```bash
npm run build   # type-checks with tsc, then bundles with vite
npm run preview # serve the production build locally
```

## Deploy to Cloudflare Pages

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** leave empty if this folder is the repo root; otherwise
  point it at wherever you placed this project.
- **Environment variables:** none required. Only add `VITE_CONTRACT_ADDRESS`
  if you're pointing at your own deployment of the contract instead of the
  one baked into `src/lib/chain.ts`.
- **Node version:** set the `NODE_VERSION` environment variable to `20` (or
  add a `.nvmrc` with `20`) if Cloudflare's default Node is older — this
  project needs Node 18+.

`public/_redirects` (already in this repo) tells Cloudflare Pages to serve
`index.html` for every path, which is required because this is a
client-side-routed single-page app (`/promise/:id` isn't a real file on
disk) — without it, refreshing or directly opening a promise's URL would
404.
