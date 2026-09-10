import assert from "node:assert/strict";
import test from "node:test";
import { forwardGenlayerRpc } from "../../api/genlayer-rpc.mjs";

test("proxy forwards bounded JSON without the browser Origin header", async () => {
  let forwarded;
  const result = await forwardGenlayerRpc({ method: "POST", body: { jsonrpc: "2.0", method: "gen_call", id: 1 } }, async (url, init) => {
    forwarded = { url, init };
    return { status: 200, text: async () => JSON.stringify({ jsonrpc: "2.0", id: 1, result: "[]" }) };
  });

  assert.equal(result.status, 200);
  assert.equal(forwarded.url, "https://studio.genlayer.com/api");
  assert.deepEqual(forwarded.init.headers, { "content-type": "application/json" });
  assert.equal("origin" in forwarded.init.headers, false);
});

test("proxy maps an upstream HTML error to a stable JSON failure", async () => {
  const result = await forwardGenlayerRpc({ method: "POST", body: { jsonrpc: "2.0" } }, async () => ({
    status: 502,
    text: async () => "<html>upstream failure</html>",
  }));
  assert.deepEqual(result, { status: 502, body: { error: "Studionet RPC returned a non-JSON response" } });
});

test("proxy rejects non-POST and malformed requests without an upstream call", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; throw new Error("must not run"); };
  assert.equal((await forwardGenlayerRpc({ method: "GET" }, fetchImpl)).status, 405);
  assert.equal((await forwardGenlayerRpc({ method: "POST", body: "not-json" }, fetchImpl)).status, 400);
  assert.equal(calls, 0);
});
