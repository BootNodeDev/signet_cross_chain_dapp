import { parseSignature } from "viem";

type Input = {
  token: string;
  amount: bigint | string;
};

type Output = {
  token: string;
  amount: bigint | string;
  recipient: string;
  chainId: number;
};

type Order = {
  inputs: Input[];
  outputs: Output[];
  deadline: bigint | string;
};

type UnsignedOrder = {
  order: Order;
  chainId: number;
  contractAddress: string;
};

type SignedOrder = {
  order: Order;
  signature: ReturnType<typeof parseSignature>;
  chainId: number;
  contractAddress: string;
};

type SendOrderRPCResponse = {
  txHash: string;
};

export type {
  Input,
  Output,
  Order,
  UnsignedOrder,
  SignedOrder,
  SendOrderRPCResponse,
};
