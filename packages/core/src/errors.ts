// Standard MPP.sol error codes. See spec/wire.md §9.
export enum MppErrorCode {
  InvalidSignature = 'invalid-signature',
  NonceUnknown = 'nonce-unknown',
  NonceReused = 'nonce-reused',
  NonceNotBound = 'nonce-not-bound',
  AmountInsufficient = 'amount-insufficient',
  MintMismatch = 'mint-mismatch',
  RecipientMismatch = 'recipient-mismatch',
  ClusterMismatch = 'cluster-mismatch',
  TxNotConfirmed = 'tx-not-confirmed',
  DeadlinePassed = 'deadline-passed',
  SessionNotFound = 'session-not-found',
  SessionRevoked = 'session-revoked',
  SessionExpired = 'session-expired',
  CapExceeded = 'cap-exceeded',
  SequenceReused = 'sequence-reused',
}

export class MppSolError extends Error {
  readonly code: MppErrorCode;

  constructor(code: MppErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'MppSolError';
    this.code = code;
  }
}
