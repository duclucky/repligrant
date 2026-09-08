import { describe, expect, it } from "vitest";
import { studionet } from "genlayer-js/chains";
import { shortenAddress, STUDIONET } from "./wallet";

describe("wallet display", () => {
  it("shortens an address without changing the underlying value", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678";
    expect(shortenAddress(address)).toBe("0x1234...5678");
  });

  it("uses the genlayer-js Studionet chain id for wallet switching", () => {
    expect(Number.parseInt(STUDIONET.chainId, 16)).toBe(studionet.id);
    expect(studionet.id).toBe(61999);
  });
});
