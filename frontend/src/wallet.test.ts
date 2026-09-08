import { describe, expect, it } from "vitest";
import { shortenAddress } from "./wallet";

describe("wallet display", () => {
  it("shortens an address without changing the underlying value", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678";
    expect(shortenAddress(address)).toBe("0x1234...5678");
  });
});
