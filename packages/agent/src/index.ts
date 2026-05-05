// Payer types and signer abstractions
export type {
  Ed25519Signer,
  SequenceProvider,
  DirectPayer,
  SessionPayer,
  Payer,
  MppFetchOptions,
} from './types.js';

// Header parse / serialize (will move to @mppsol/core in v0.2)
export {
  parseChallenge,
  serializeAuthorization,
  parseReceipt,
  parseChallengeError,
  b64urlEncode,
  b64urlDecode,
} from './headers.js';

// Reference Ed25519 signer
export { keypairSigner, generateSigner } from './signer.js';

// Session-mode debit signing
export {
  signSessionDebit,
  buildSessionAuthorizationHeader,
  resolveSequence,
  type SignedDebit,
  type SignSessionDebitOptions,
} from './session.js';

// Direct-mode authorization construction
export { buildDirectAuthorizationHeader } from './direct.js';

// High-level fetch wrapper
export { mppFetch, MppPaymentError } from './fetch.js';
