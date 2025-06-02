import axios from "axios";
import {
  ETH_AMOUNT,
  HOST_CHAIN_ID,
  PERMIT2_CONTRACT,
  ROLLUP_CHAIN_ID,
  ROLLUP_ORDERS_CONTRACT,
  RPC_ENDPOINT,
} from "../constants/signet";
import { Address, getAddress, Hex, parseSignature, WalletClient } from "viem";
import {
  Order,
  Permit2Batch,
  SendOrderRPCResponse,
  SignedOrder,
  UnsignedOrder,
} from "../types/signet";

// TODO Remove
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const DEFAULT_DEADLINE = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);

/**
 * Create an unsigned order
 * @param accountAddress The signer's address
 * @param rollupTokenAddress token address on the rollup
 * @param hostTokenAddress token address on the host chain
 * @returns An unsigned order
 */
export const createUnsignedOrder = (
  accountAddress: Address,
  rollupTokenAddress: Address,
  hostTokenAddress: Address,
  amount: bigint = ETH_AMOUNT,
): UnsignedOrder => {
  const order: Order = {
    inputs: [
      {
        token: getAddress(rollupTokenAddress),
        amount,
      },
    ],
    outputs: [
      {
        token: getAddress(hostTokenAddress),
        amount,
        recipient: getAddress(accountAddress),
        chainId: HOST_CHAIN_ID,
      },
    ],
    deadline: DEFAULT_DEADLINE,
  };

  const permit2Batch: Permit2Batch = {
    permit: {
      permitted: order.inputs.map((input) => ({
        token: input.token,
        amount: input.amount,
      })),
      nonce: BigInt(Math.floor(Math.random() * 1000000)), // Generate a random nonce
      deadline: DEFAULT_DEADLINE,
    },
    owner: getAddress(accountAddress),
  };

  return {
    order,
    permit2: permit2Batch,
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
  account: Address,
  client: WalletClient,
): Promise<SignedOrder> => {
  // EIP-712 typed data for signing
  const orderDomain = {
    name: "RollupOrders",
    version: "1",
    chainId: BigInt(unsignedOrder.chainId),
    verifyingContract: unsignedOrder.contractAddress as Hex,
  };

  // Define the types according to the contract's expected format
  const orderTypes = {
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
  const signedOrder = await client.signTypedData({
    account,
    domain: orderDomain,
    types: orderTypes,
    primaryType: "Order",
    message: unsignedOrder.order,
  });

  // const orderSignature = parseSignature(signedOrder);
  const orderSignature = signedOrder;
  // EIP-712 typed data for signing the Permit2 batch
  const permit2Domain = {
    name: "Permit2",
    chainId: BigInt(unsignedOrder.chainId),
    verifyingContract: PERMIT2_CONTRACT as Hex,
  };

  const permit2Types = {
    PermitBatchTransferFrom: [
      { name: "permitted", type: "TokenPermissions[]" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    TokenPermissions: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  };

  // Sign the Permit2 batch
  const signetPermit2 = await client.signTypedData({
    account,
    domain: permit2Domain,
    types: permit2Types,
    primaryType: "PermitBatchTransferFrom",
    message: unsignedOrder.permit2.permit,
  });

  // Update the permit2 signature
  // unsignedOrder.permit2.signature = parseSignature(signetPermit2);
  unsignedOrder.permit2.signature = signetPermit2;

  return {
    order: unsignedOrder.order,
    permit2: unsignedOrder.permit2,
    signature: orderSignature,
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
