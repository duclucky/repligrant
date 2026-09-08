import { readFileSync } from "node:fs";
import { createAccount, createClient } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";
const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter((line) => line.includes("=") && !line.trim().startsWith("#")).map((line) => { const i = line.indexOf("="); return [line.slice(0, i).trim(), line.slice(i + 1).trim()]; }));
const deployment = JSON.parse(readFileSync(new URL("../deployment.json", import.meta.url), "utf8"));
const client = createClient({ chain: studionet, account: createAccount(env.STUDIONET_PRIVATE_KEY), endpoint: "https://studio.genlayer.com/api" });
const list = await client.readContract({ address: deployment.contract_address, functionName: "list_rounds" });
console.log(JSON.stringify({ list }, null, 2));
