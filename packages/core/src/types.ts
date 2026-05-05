// Wire-level type aliases (HTTP header values are strings)

export type Cluster = 'mainnet-beta' | 'devnet' | 'testnet';

export type Confirmation = 'processed' | 'confirmed' | 'finalized';

export type Scheme = 'solana-direct' | 'solana-session';

export type Base58Pubkey = string;

export type Base64Url = string;

export type Mint = Base58Pubkey | 'native';

export type Amount = string;

export type UnixSecondsString = string;

// Parsed `WWW-Authenticate: Payment` challenge for the Solana settlement methods.
export interface SolanaChallenge {
  realm: string;
  methods: Scheme[];
  cluster: Cluster;
  recipient: Base58Pubkey;
  mint: Mint;
  amount: Amount;
  nonce: Base64Url;
  deadline: UnixSecondsString;
  minConfirmations?: Confirmation;
}

// Authorization: Payment header — solana-direct
export interface SolanaDirectAuthorization {
  scheme: 'solana-direct';
  signature: Base64Url;
  nonce: Base64Url;
}

// Authorization: Payment header — solana-session
export interface SolanaSessionAuthorization {
  scheme: 'solana-session';
  session: Base58Pubkey;
  debit: Base64Url;
  signature: Base64Url;
}

export type SolanaAuthorization =
  | SolanaDirectAuthorization
  | SolanaSessionAuthorization;

// Payment-Receipt header — solana-direct
export interface SolanaDirectReceipt {
  scheme: 'solana-direct';
  tx: Base64Url;
  slot: string;
  cluster: Cluster;
  recipient: Base58Pubkey;
  mint: Mint;
  amount: Amount;
  nonce: Base64Url;
}

// Payment-Receipt header — solana-session
export interface SolanaSessionReceipt {
  scheme: 'solana-session';
  session: Base58Pubkey;
  sequence: string;
  amount: Amount;
  nonce: Base64Url;
  settlementTx?: Base64Url;
}

export type SolanaReceipt = SolanaDirectReceipt | SolanaSessionReceipt;

// Off-chain debit message. 104 bytes when canonically serialized.
// See spec/wire.md §4.2 and spec/session.md §4.2.
export interface Debit {
  session: Uint8Array;
  nonce: Uint8Array;
  amount: bigint;
  expiry: bigint;
  sequence: bigint;
  domainSep: Uint8Array;
}

// On-chain session account, read-side. See spec/session.md §2.1.
export interface Session {
  owner: Base58Pubkey;
  authorizedSigner: Base58Pubkey;
  server: Base58Pubkey;
  mint: Base58Pubkey;
  escrow: Base58Pubkey;
  totalCap: bigint;
  remainingCap: bigint;
  lastSeenSequence: bigint;
  expiry: bigint;
  state: SessionState;
  clusterGenesisHash: Uint8Array;
  sessionId: Uint8Array;
  bump: number;
}

export enum SessionState {
  Active = 0,
  Revoked = 1,
  Closed = 2,
}

// CPI return-data structure from `Pay` instruction. See spec/cpi.md §4.1.
export interface PayReturn {
  discriminator: Uint8Array;
  nonce: Uint8Array;
  requestHash: Uint8Array;
  amount: bigint;
  recipient: Base58Pubkey;
  mint: Base58Pubkey;
  slot: bigint;
}

// CPI return-data structure from `SettleViaSession` instruction.
// See spec/cpi.md §4.2.
export interface SessionSettleReturn {
  discriminator: Uint8Array;
  nonce: Uint8Array;
  requestHash: Uint8Array;
  amount: bigint;
  recipient: Base58Pubkey;
  mint: Base58Pubkey;
  slot: bigint;
}
