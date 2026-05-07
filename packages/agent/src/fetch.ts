import { parseChallenge, parseChallengeError } from '@mppsol/core';
import { buildDirectAuthorizationHeader } from './direct.js';
import {
  buildSessionAuthorizationHeader,
  resolveSequence,
  signSessionDebit,
} from './session.js';
import type { MppFetchOptions, Payer } from './types.js';

// Drop-in replacement for fetch() that auto-handles MPP `402 Payment Required`
// responses. On a 402, parses the WWW-Authenticate challenge, dispatches
// to the configured payer, and retries the request with an
// Authorization: Payment header.
//
// The Payment-Receipt header (if present on the 2xx response) is left
// untouched on the Response object so the caller can inspect or persist it.
export async function mppFetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  opts: MppFetchOptions,
): Promise<Response> {
  const fetchImpl = opts.fetch ?? fetch;
  const maxRetries = opts.maxRetries ?? 1;

  let response = await fetchImpl(input, init);
  let retries = 0;

  while (response.status === 402 && retries < maxRetries) {
    const wwwAuth = response.headers.get('www-authenticate');
    if (!wwwAuth) {
      throw new Error('402 response missing WWW-Authenticate header');
    }

    const errCode = parseChallengeError(wwwAuth);
    if (errCode) {
      throw new MppPaymentError(errCode, response);
    }

    const challenge = parseChallenge(wwwAuth);
    const authHeader = await buildAuthorization(challenge, opts.payer);

    const retryInit: RequestInit = {
      ...init,
      headers: mergeHeaders(init?.headers, { authorization: authHeader }),
    };
    response = await fetchImpl(input, retryInit);
    retries++;
  }

  return response;
}

async function buildAuthorization(
  challenge: ReturnType<typeof parseChallenge>,
  payer: Payer,
): Promise<string> {
  if (payer.kind === 'direct') {
    if (!challenge.methods.includes('solana-direct')) {
      throw new Error("server does not advertise 'solana-direct'");
    }
    const { signature } = await payer.submit(challenge);
    return buildDirectAuthorizationHeader(challenge, signature);
  }

  if (!challenge.methods.includes('solana-session')) {
    throw new Error("server does not advertise 'solana-session'");
  }
  const sequence = await resolveSequence(payer.nextSequence);
  const amount = payer.debitAmount?.(challenge);
  const expiry = payer.debitExpiry?.(challenge);
  const signed = await signSessionDebit({
    challenge,
    session: payer.session,
    signer: payer.signer,
    sequence,
    ...(amount !== undefined && { amount }),
    ...(expiry !== undefined && { expiry }),
  });
  return buildSessionAuthorizationHeader(payer.session, signed);
}

function mergeHeaders(
  base: HeadersInit | undefined,
  added: Record<string, string>,
): Headers {
  const headers = new Headers(base);
  for (const [k, v] of Object.entries(added)) headers.set(k, v);
  return headers;
}

export class MppPaymentError extends Error {
  readonly code: string;
  readonly response: Response;
  constructor(code: string, response: Response) {
    super(`MPP server rejected payment: ${code}`);
    this.name = 'MppPaymentError';
    this.code = code;
    this.response = response;
  }
}
