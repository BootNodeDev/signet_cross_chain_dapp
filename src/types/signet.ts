import { Address, Hex, parseSignature } from "viem";

type Input = {
  token: Address;
  amount: bigint;
};

type Output = {
  token: Address;
  amount: bigint;
  recipient: Address;
  chainId: number;
};

type Order = {
  inputs: Input[];
  outputs: Output[];
  deadline: bigint;
};

type TokenPermissions = {
  token: Address;
  amount: bigint;
};

type PermitBatchTransferFrom = {
  permitted: TokenPermissions[];
  nonce: bigint;
  deadline: bigint;
};

// type Signature = ReturnType<typeof parseSignature>;
type Signature = Hex;
type Permit2Batch = {
  permit: PermitBatchTransferFrom;
  owner: Address;
  signature?: Signature;
};

type UnsignedOrder = {
  order: Order;
  permit2: Permit2Batch;
  chainId: number;
  contractAddress: Address;
};

type SignedOrder = UnsignedOrder & {
  signature: Signature;
};

// TODO Replace with real return type
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
  Permit2Batch,
};
