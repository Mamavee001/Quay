export type StellarNetwork = "public" | "testnet";

export function getStellarNetwork(): StellarNetwork {
  const envVal = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? process.env.STELLAR_NETWORK;
  return envVal === "public" ? "public" : "testnet";
}

export function explorerUrl(hash: string, network: StellarNetwork = getStellarNetwork()): string {
  const base = network === "public" ? "https://stellar.expert/explorer/public" : "https://stellar.expert/explorer/testnet";
  return `${base}/tx/${hash}`;
}

export function addressUrl(addr: string, network: StellarNetwork = getStellarNetwork()): string {
  const base = network === "public" ? "https://stellar.expert/explorer/public" : "https://stellar.expert/explorer/testnet";
  return `${base}/account/${addr}`;
}

export function networkLabel(network: StellarNetwork = getStellarNetwork()): string {
  return network === "public" ? "Mainnet" : "Testnet";
}
