const STUDIONET_RPC = "https://studio.genlayer.com/api";
const MAX_BODY_BYTES = 64 * 1024;

function jsonResult(status, body) {
  return { status, body };
}

function parseRequestBody(body) {
  if (typeof body === "string") return JSON.parse(body);
  if (Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  return body;
}

export async function forwardGenlayerRpc(request, fetchImpl = fetch) {
  if (request.method !== "POST") return jsonResult(405, { error: "Method not allowed" });

  let body;
  try {
    body = parseRequestBody(request.body);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid body");
    if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY_BYTES) {
      return jsonResult(413, { error: "RPC request is too large" });
    }
  } catch {
    return jsonResult(400, { error: "RPC request must be a JSON object" });
  }

  try {
    const upstream = await fetchImpl(STUDIONET_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await upstream.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return jsonResult(502, { error: "Studionet RPC returned a non-JSON response" });
    }
    return jsonResult(upstream.status, parsed);
  } catch {
    return jsonResult(502, { error: "Studionet RPC is temporarily unavailable" });
  }
}

export default async function handler(request, response) {
  const result = await forwardGenlayerRpc(request);
  response.statusCode = result.status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(result.body));
}
