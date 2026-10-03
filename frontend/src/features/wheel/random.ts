const UINT32_RANGE = 0x1_0000_0000;

export function randomIndex(length: number, getRandomValues = crypto.getRandomValues.bind(crypto)): number {
  if (!Number.isInteger(length) || length < 1 || length > 0xffff_ffff) {
    throw new RangeError("The choice count must be between 1 and 2^32 - 1.");
  }
  const limit = Math.floor(UINT32_RANGE / length) * length;
  const value = new Uint32Array(1);
  do {
    getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % length;
}
