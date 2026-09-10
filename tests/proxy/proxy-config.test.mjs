import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("browser GenLayer RPC uses the bounded same-origin function", async () => {
  const config = JSON.parse(await readFile(new URL("../../vercel.json", import.meta.url), "utf8"));
  const rpcRewrite = config.rewrites.find((rule) => rule.source === "/genlayer-rpc");
  assert.equal(rpcRewrite?.destination, "/api/genlayer-rpc");
});
