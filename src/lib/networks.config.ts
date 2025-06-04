// networks.config.ts
/**
 * This file contains the configuration for the networks used in the application.
 *
 * @packageDocumentation
 */
import { defineChain, http, type Transport } from "viem";

import {
  CHAIN_ID_HOST,
  CHAIN_ID_ROLLUP,
  RPC_ENDPOINT_HOST,
  RPC_ENDPOINT_ROLLUP,
} from "../constants/signet";

export const signetPecorino = defineChain({
  id: CHAIN_ID_ROLLUP,
  name: "Signet Pecorino",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [RPC_ENDPOINT_ROLLUP],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.pecorino.signet.sh" },
  },
  contracts: {},
});

export const holeskyPecorino = defineChain({
  id: CHAIN_ID_HOST,
  name: "Holesky Pecorino Host",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [RPC_ENDPOINT_HOST],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "" },
  },
});
const devChains = [signetPecorino, holeskyPecorino] as const;
// const prodChains = [] as const;
// const allChains = [...devChains, ...prodChains] as const;
export const chains = devChains; // TODO includeTestnets ? allChains : prodChains;
export type ChainsIds = (typeof chains)[number]["id"];

type RestrictedTransports = Record<ChainsIds, Transport>;
export const transports: RestrictedTransports = {
  [signetPecorino.id]: http(signetPecorino.rpcUrls.default.http[0]),
  [holeskyPecorino.id]: http(holeskyPecorino.rpcUrls.default.http[0]),
};
