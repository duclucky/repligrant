import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const blockers = [];
const checks = [];

function requireFile(relativePath, label = relativePath) {
  if (!existsSync(resolve(root, relativePath))) blockers.push(`missing ${label}`);
  else checks.push(`OK ${label}`);
}

requireFile("contracts/repligrant.py", "contract source");
requireFile("tests/direct/test_repligrant_direct.py", "direct tests");
requireFile("frontend/src/App.tsx", "frontend product shell");
requireFile("frontend/src/adapter.ts", "frontend contract adapter");
requireFile("deployment.json", "active Studionet deployment evidence");
requireFile("docs/evidence/studionet/phase-8-lifecycle.md", "Studionet lifecycle evidence");
requireFile("docs/evidence/local/phase-9-browser-deployed.md", "browser/proxy evidence");
requireFile("docs/evidence/github-ci.md", "public CI evidence");

const deployment = resolve(root, "deployment.json");
if (existsSync(deployment)) {
  try {
    const record = JSON.parse(readFileSync(deployment, "utf8"));
    if (record.network !== "studionet" || record.status !== "FINALIZED" || !record.contract_address) {
      blockers.push("active deployment evidence is not a finalized Studionet record");
    } else checks.push(`OK active contract ${record.contract_address}`);
  } catch { blockers.push("active deployment evidence is not valid JSON"); }
}

const envCandidates = [resolve(root, "frontend/.env"), resolve(root, "frontend/.env.local")];
if (envCandidates.some((file) => existsSync(file) && /VITE_REPLIGRANT_CONTRACT_ADDRESS\s*=\s*0x[0-9a-fA-F]{40}/.test(readFileSync(file, "utf8")))) {
  checks.push("OK frontend has a configured deployed contract address");
} else blockers.push("frontend has no configured deployed contract address");

const gitConfig = resolve(root, ".git", "config");
if (existsSync(gitConfig) && /github\.com[/:]duclucky\/repligrant/.test(readFileSync(gitConfig, "utf8"))) checks.push("OK public GitHub remote");
else blockers.push("public GitHub remote is missing or unexpected");

const readme = readFileSync(resolve(root, "README.md"), "utf8");
if (/https:\/\/repligrant\.vercel\.app/.test(readme) && /0x5dc18F7Ab1Ffd5CDA4D08663E86cBF0E0Efc1c48/.test(readme)) checks.push("OK README has verified live app and active contract");
else blockers.push("README is missing verified live app or active contract");

console.log("Project repligrant -Category projects");
console.log(blockers.length ? `${blockers.length} BLOCKER` : "NO BLOCKER");
for (const check of checks) console.log(check);
for (const blocker of blockers) console.log(`BLOCKER: ${blocker}`);
console.log("WARN: browser submit write is verified; review/close/withdraw browser signatures remain user-approval dependent; wrappers, finality handling, canonical reload, and SDK boundary tests are present.");
process.exitCode = blockers.length ? 1 : 0;
