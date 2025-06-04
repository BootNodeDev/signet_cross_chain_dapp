import axios from "axios";
import {
  ETH_AMOUNT,
  PERMIT2_CONTRACT,
  CHAIN_ID_ROLLUP,
  ROLLUP_ORDERS_CONTRACT,
  CHAIN_ID_HOST,
  RPC_ENDPOINT_ROLLUP,
} from "../constants/signet";
import { Address, getAddress, hashTypedData, WalletClient } from "viem";
import {
  Order,
  Permit2Batch,
  PermitBatchTransferFrom,
  PermitBatchWitnessTransferFrom,
  PermitSigningArgs,
  PermitSigningInfo,
  SendOrderRPCResponse,
  SignedOrder,
  UnsignedOrder,
} from "../types/signet";

// TODO Remove and serialize bigint without this
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// 5 minutes deadline
const DEFAULT_DEADLINE = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);

/**
 * Create an unsigned order
 * @param accountAddress The signer's address
 * @param rollupTokenAddress token address on the rollup
 * @param hostTokenAddress token address on the host chain
 * @param amount The amount of tokens to be transferred
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
        chainId: CHAIN_ID_HOST,
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
      nonce: BigInt(Date.now()) * 1_000_000n, // timestamp as microseconds
      deadline: DEFAULT_DEADLINE,
    },
    owner: getAddress(accountAddress),
  };

  return {
    order,
    permit2: permit2Batch,
    chainId: CHAIN_ID_ROLLUP,
    contractAddress: getAddress(ROLLUP_ORDERS_CONTRACT),
  };
};

const permitSigningInfo = ({
  outputs,
  deadline,
  nonce,
  rollupChainId,
  rollupOrderContract,
  permitted,
}: PermitSigningArgs): PermitSigningInfo => {
  const permitBatch: PermitBatchWitnessTransferFrom = {
    permitted,
    spender: rollupOrderContract,
    nonce,
    deadline,
    outputs,
  };

  const domain = {
    chainId: rollupChainId,
    name: "Permit2",
    verifyingContract: PERMIT2_CONTRACT as Address,
  };

  const signingHash = hashTypedData({
    domain,
    types: {
      PermitBatchWitnessTransferFrom: [
        { name: "permitted", type: "Permitted[]" },
        { name: "spender", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "outputs", type: "Output[]" },
      ],
      Permitted: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      Output: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
      ],
    },
    primaryType: "PermitBatchWitnessTransferFrom",
    message: permitBatch,
  });

  const permit: PermitBatchTransferFrom = {
    permitted: permitBatch.permitted,
    nonce,
    deadline,
  };

  return {
    signingHash,
    permit,
    outputs: permitBatch.outputs,
  };
};

const signOrder = async (
  unsignedOrder: UnsignedOrder,
  account: Address,
  client: WalletClient,
): Promise<SignedOrder> => {
  const permit = permitSigningInfo({
    outputs: unsignedOrder.order.outputs,
    nonce: unsignedOrder.permit2.permit.nonce,
    deadline: unsignedOrder.permit2.permit.deadline,
    rollupChainId: unsignedOrder.chainId,
    rollupOrderContract: unsignedOrder.contractAddress,
    permitted: unsignedOrder.permit2.permit.permitted,
  });

  const signature = await client.signMessage({
    account,
    message: permit.signingHash,
  });

  return {
    permit: permit.permit,
    signature,
    owner: account,
    outputs: permit.outputs,
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
      RPC_ENDPOINT_ROLLUP,
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
