import { describe, it, expect } from 'vitest';
import {
  DEBIT_DOMAIN_SEP,
  RESULT_DOMAIN_SEP,
  PAY_RETURN_DISCRIMINATOR,
  SESSION_RETURN_DISCRIMINATOR,
  DEBIT_BYTE_LENGTH,
  SESSION_PDA_BYTE_LENGTH,
  USDC_MAINNET_MINT,
} from '../src/index.js';

const decoder = new TextDecoder();

describe('domain separators', () => {
  it('DEBIT_DOMAIN_SEP is exactly 16 bytes', () => {
    expect(DEBIT_DOMAIN_SEP.length).toBe(16);
  });

  it('DEBIT_DOMAIN_SEP encodes to "MPP.SOL/DEBIT001"', () => {
    expect(decoder.decode(DEBIT_DOMAIN_SEP)).toBe('MPP.SOL/DEBIT001');
  });

  it('RESULT_DOMAIN_SEP is exactly 16 bytes', () => {
    expect(RESULT_DOMAIN_SEP.length).toBe(16);
  });

  it('RESULT_DOMAIN_SEP encodes to "MPP.SOL/RESULT01"', () => {
    expect(decoder.decode(RESULT_DOMAIN_SEP)).toBe('MPP.SOL/RESULT01');
  });

  it('DEBIT_DOMAIN_SEP and RESULT_DOMAIN_SEP are distinct', () => {
    expect([...DEBIT_DOMAIN_SEP]).not.toEqual([...RESULT_DOMAIN_SEP]);
  });
});

describe('return-data discriminators', () => {
  it('PAY_RETURN_DISCRIMINATOR is "PAY1"', () => {
    expect(decoder.decode(PAY_RETURN_DISCRIMINATOR)).toBe('PAY1');
    expect(PAY_RETURN_DISCRIMINATOR.length).toBe(4);
  });

  it('SESSION_RETURN_DISCRIMINATOR is "SES1"', () => {
    expect(decoder.decode(SESSION_RETURN_DISCRIMINATOR)).toBe('SES1');
    expect(SESSION_RETURN_DISCRIMINATOR.length).toBe(4);
  });
});

describe('byte length constants', () => {
  it('DEBIT_BYTE_LENGTH matches 32+32+8+8+8+16', () => {
    expect(DEBIT_BYTE_LENGTH).toBe(104);
    expect(DEBIT_BYTE_LENGTH).toBe(32 + 32 + 8 + 8 + 8 + 16);
  });

  it('SESSION_PDA_BYTE_LENGTH is per spec/session.md §2.1', () => {
    expect(SESSION_PDA_BYTE_LENGTH).toBe(234);
  });
});

describe('well-known addresses', () => {
  it('USDC_MAINNET_MINT is the canonical mint', () => {
    expect(USDC_MAINNET_MINT).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  });
});
