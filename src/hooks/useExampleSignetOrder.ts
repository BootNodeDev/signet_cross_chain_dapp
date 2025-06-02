import { useWeb3StatusConnected } from "@/src/hooks/useWeb3Status";
import { useCallback, useState } from "react";
import { createUnsignedOrder, signOrder } from "../utils/signet";
import { Address } from "viem";
import { SignedOrder } from "../types/signet";

export const useExampleSignetOrder = () => {
  const { address: walletAddress, walletClient } = useWeb3StatusConnected();
  const [signedOrder, setSignedOrder] = useState<SignedOrder | null>(null);

  const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
  // TODO amount
  const createSignedOrder = useCallback(
    async (tokenIn: Address = ETH_ADDRESS, tokenOut: Address = ETH_ADDRESS) => {
      const order = createUnsignedOrder(walletAddress, tokenIn, tokenOut);

      const signed = await signOrder(order, walletAddress, walletClient);
      setSignedOrder(signed);
      return signed;
    },
    [walletAddress, walletClient],
  );

  return { createSignedOrder, signedOrder };
};
