import { DUSDC_DECIMALS, FLOAT_SCALING } from './constants.js';

const DUSDC_UNIT = 10 ** DUSDC_DECIMALS;

/** ×1e9 fixed-point integer -> human number (a dollar price, or a 0..1 probability). */
export function fromScaled(value: number | bigint): number {
  return Number(value) / FLOAT_SCALING;
}

/** human number -> ×1e9 fixed-point bigint. */
export function toScaled(value: number): bigint {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`toScaled: invalid value ${value}`);
  return BigInt(Math.round(value * FLOAT_SCALING));
}

/** dUSDC base units (6dp) -> human dollars. */
export function fromDusdc(value: number | bigint): number {
  return Number(value) / DUSDC_UNIT;
}

/** human dollars -> dUSDC base units (6dp) bigint. */
export function toDusdc(value: number): bigint {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`toDusdc: invalid value ${value}`);
  return BigInt(Math.round(value * DUSDC_UNIT));
}
