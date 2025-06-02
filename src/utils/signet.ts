import axios from "axios";
import {
  ETH_AMOUNT,
  HOST_CHAIN_ID,
  ROLLUP_CHAIN_ID,
  ROLLUP_ORDERS_CONTRACT,
  RPC_ENDPOINT,
} from "../constants/signet";
import { getAddress, Hex, parseSignature, WalletClient } from "viem";
import {
  Order,
  SendOrderRPCResponse,
  SignedOrder,
  UnsignedOrder,
} from "../types/signet";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

/**
 * Create an unsigned order
 * @param accountAddress The signer's address
 * @param rollupTokenAddress token address on the rollup
 * @param hostTokenAddress token address on the host chain
 * @returns An unsigned order
 */
export const createUnsignedOrder = (
  accountAddress: string,
  rollupTokenAddress: string,
  hostTokenAddress: string,
): UnsignedOrder => {
  // Deadline 5 minutes from now
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);

  const order: Order = {
    inputs: [
      {
        token: getAddress(rollupTokenAddress),
        amount: ETH_AMOUNT,
      },
    ],
    outputs: [
      {
        token: getAddress(hostTokenAddress),
        amount: ETH_AMOUNT,
        recipient: getAddress(accountAddress),
        chainId: HOST_CHAIN_ID,
      },
    ],
    deadline,
  };

  return {
    order,
    chainId: ROLLUP_CHAIN_ID,
    contractAddress: getAddress(ROLLUP_ORDERS_CONTRACT),
  };
};

/**
 * Sign an unsigned order
 * @param unsignedOrder The unsigned order
 * @param account The viem account
 * @param client The wallet client
 * @returns A signed order
 */
const signOrder = async (
  unsignedOrder: UnsignedOrder,
  account: `0x${string}`,
  client: WalletClient,
): Promise<SignedOrder> => {
  // EIP-712 typed data for signing
  const domain = {
    name: "RollupOrders",
    version: "1",
    chainId: BigInt(unsignedOrder.chainId),
    verifyingContract: unsignedOrder.contractAddress as Hex,
  };

  // Convert bigint to string for JSON compatibility
  const orderForSigning = {
    ...unsignedOrder.order,
    deadline: unsignedOrder.order.deadline.toString(),
    inputs: unsignedOrder.order.inputs.map((input) => ({
      ...input,
      amount: input.amount.toString(),
    })),
    outputs: unsignedOrder.order.outputs.map((output) => ({
      ...output,
      amount: output.amount.toString(),
    })),
  };

  // Define the types according to the contract's expected format
  const types = {
    Order: [
      { name: "deadline", type: "uint256" },
      { name: "inputs", type: "Input[]" },
      { name: "outputs", type: "Output[]" },
    ],
    Input: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    Output: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "chainId", type: "uint32" },
    ],
  };

  // Sign the typed data
  const signedData = await client.signTypedData({
    account,
    domain,
    types,
    primaryType: "Order",
    message: orderForSigning,
  });

  const signature = parseSignature(signedData);

  return {
    order: orderForSigning,
    signature: signature,
    chainId: unsignedOrder.chainId,
    contractAddress: unsignedOrder.contractAddress,
  };
};

/**
 * Send a signed order to the Signet RPC endpoint
 * @param signedOrder The signed order
 * @returns Response from the RPC endpoint
 */
async function sendSignedOrder(signedOrder: SignedOrder) {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "signet_sendOrder",
    params: signedOrder,
  };

  try {
    const response = await axios.post<SendOrderRPCResponse>(
      RPC_ENDPOINT,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error sending order:", error);
    throw error;
  }
}

export { sendSignedOrder, signOrder };
