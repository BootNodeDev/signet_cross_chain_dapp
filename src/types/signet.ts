import { Address, Hex } from "viem";

type Input = {
  token: Address;
  amount: bigint;
};
type TokenPermissions = Input;

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

type PermitBatchTransferFrom = {
  permitted: TokenPermissions[];
  nonce: bigint;
  deadline: bigint;
};

type PermitBatchWitnessTransferFrom = PermitBatchTransferFrom & {
  spender: Address;
  outputs: Output[];
};

type PermitSigningInfo = {
  outputs: Output[];
  signingHash: Hex;
  permit: PermitBatchTransferFrom;
};

type PermitSigningArgs = {
  outputs: Output[];
  permitted: TokenPermissions[];
  deadline: bigint;
  nonce: bigint;
  rollupChainId: number;
  rollupOrderContract: Address;
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

type SignedOrder = {
  permit: Permit2Batch;
  outputs: Output[];
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
  PermitBatchWitnessTransferFrom,
  PermitBatchTransferFrom,
  PermitSigningInfo,
  PermitSigningArgs,
  Permit2Batch,
};
