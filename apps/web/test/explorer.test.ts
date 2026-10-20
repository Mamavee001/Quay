import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getStellarNetwork,
  explorerUrl,
  addressUrl,
  networkLabel,
} from "../lib/explorer";

describe("explorer helpers (issue 5.30 / #387)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getStellarNetwork", () => {
    it("defaults to testnet when no env var is set", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "");
      vi.stubEnv("STELLAR_NETWORK", "");
      delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
      delete process.env.STELLAR_NETWORK;
      expect(getStellarNetwork()).toBe("testnet");
    });

    it("returns public when NEXT_PUBLIC_STELLAR_NETWORK=public", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "public");
      expect(getStellarNetwork()).toBe("public");
    });

    it("falls back to STELLAR_NETWORK=public when NEXT_PUBLIC is not set", () => {
      delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
      vi.stubEnv("STELLAR_NETWORK", "public");
      expect(getStellarNetwork()).toBe("public");
    });

    it("returns testnet for any non-public value", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "testnet");
      expect(getStellarNetwork()).toBe("testnet");
    });
  });

  describe("explorerUrl", () => {
    it("builds testnet transaction URLs by default", () => {
      delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
      delete process.env.STELLAR_NETWORK;
      expect(explorerUrl("abc123hash")).toBe(
        "https://stellar.expert/explorer/testnet/tx/abc123hash"
      );
    });

    it("builds public transaction URLs when network is public", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "public");
      expect(explorerUrl("abc123hash")).toBe(
        "https://stellar.expert/explorer/public/tx/abc123hash"
      );
    });

    it("respects explicit network argument", () => {
      expect(explorerUrl("abc123hash", "public")).toBe(
        "https://stellar.expert/explorer/public/tx/abc123hash"
      );
      expect(explorerUrl("abc123hash", "testnet")).toBe(
        "https://stellar.expert/explorer/testnet/tx/abc123hash"
      );
    });
  });

  describe("addressUrl", () => {
    it("builds testnet account URLs by default", () => {
      delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
      delete process.env.STELLAR_NETWORK;
      expect(addressUrl("GABC123456")).toBe(
        "https://stellar.expert/explorer/testnet/account/GABC123456"
      );
    });

    it("builds public account URLs when network is public", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "public");
      expect(addressUrl("GABC123456")).toBe(
        "https://stellar.expert/explorer/public/account/GABC123456"
      );
    });

    it("respects explicit network argument", () => {
      expect(addressUrl("GABC123456", "public")).toBe(
        "https://stellar.expert/explorer/public/account/GABC123456"
      );
      expect(addressUrl("GABC123456", "testnet")).toBe(
        "https://stellar.expert/explorer/testnet/account/GABC123456"
      );
    });
  });

  describe("networkLabel", () => {
    it("returns Testnet by default", () => {
      delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
      delete process.env.STELLAR_NETWORK;
      expect(networkLabel()).toBe("Testnet");
    });

    it("returns Mainnet when public", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "public");
      expect(networkLabel()).toBe("Mainnet");
    });

    it("respects explicit network argument", () => {
      expect(networkLabel("public")).toBe("Mainnet");
      expect(networkLabel("testnet")).toBe("Testnet");
    });
  });
});
