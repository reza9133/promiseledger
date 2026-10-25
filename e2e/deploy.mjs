#!/usr/bin/env node
// Deploys contracts/promise_ledger.py (v2) to GenLayer Studionet and prints the address.
//   PL_PRIVATE_KEY=0x...  optional (a throw-away key is generated otherwise)
//   node e2e/deploy.mjs
import { createAccount, deployLedger, EXPLORER, fund, generatePrivateKey, makeClient } from "./lib.mjs";

const key = process.env.PL_PRIVATE_KEY || generatePrivateKey();
const account = createAccount(key);
const client = makeClient(account);
const funded = await fund(client, account.address);
console.log(`deployer ${account.address}${funded === true ? " (funded via sim_fundAccount)" : ` (funding note: ${funded})`}`);
const { address, hash } = await deployLedger(client);
console.log(`\nPromiseLedger v2 deployed\n  address : ${address}\n  tx      : ${EXPLORER}/tx/${hash}\n  contract: ${EXPLORER}/contracts/${address}`);
console.log(`\nNext:\n  export PL_CONTRACT_ADDRESS=${address}\n  npm run e2e\n  # frontend: VITE_CONTRACT_ADDRESS=${address}`);
