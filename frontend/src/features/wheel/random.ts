const UINT32_RANGE = 0x1_0000_0000;

export function winnerRotation(rotation: number, count: number, index: number, landingFraction = 0.5): number {
  if (!Number.isFinite(rotation) || !Number.isInteger(count) || count < 1 || !Number.isInteger(index) || index < 0 || index >= count || !Number.isFinite(landingFraction) || landingFraction <= 0 || landingFraction >= 1) {
    throw new RangeError("Choose a valid wheel section before spinning.");
  }
  const current = ((rotation % 360) + 360) % 360;
  const landingAngle = (360 / count) * (index + landingFraction);
  const correction = ((-current - landingAngle) % 360 + 360) % 360;
  return rotation + 360 * 6 + correction;
}

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
