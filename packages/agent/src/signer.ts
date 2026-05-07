import { ed25519 } from '@noble/curves/ed25519';
import { base58 } from '@scure/base';
import type { Ed25519Signer } from './types.js';

// Reference Ed25519 signer implementation from raw 32-byte private key.
// Suitable for keys held in process. For HSM, hardware wallet, or
// browser-wallet-adapter signers, implement Ed25519Signer directly.
export function keypairSigner(privateKey: Uint8Array): Ed25519Signer {
  if (privateKey.length !== 32) {
    throw new Error(`Ed25519 private key must be 32 bytes, got ${privateKey.length}`);
  }
  const publicKeyBytes = ed25519.getPublicKey(privateKey);
  const publicKey = base58.encode(publicKeyBytes);
  return {
    publicKey,
    sign(message) {
      return ed25519.sign(message, privateKey);
    },
  };
}

// Generate a fresh Ed25519 keypair. Returns the signer plus its raw
// private key bytes (so caller can persist).
export function generateSigner(): {
  signer: Ed25519Signer;
  privateKey: Uint8Array;
} {
  const privateKey = ed25519.utils.randomPrivateKey();
  return { signer: keypairSigner(privateKey), privateKey };
}
