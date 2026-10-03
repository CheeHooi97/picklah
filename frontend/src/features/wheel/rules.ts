export function hasDuplicateOptions(options: string[]): boolean {
  const seen = new Set<string>();
  for (const option of options) {
    const label = option.trim().toLowerCase();
    if (!label) continue;
    if (seen.has(label)) return true;
    seen.add(label);
  }
  return false;
}
