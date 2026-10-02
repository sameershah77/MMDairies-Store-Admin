/** First + last word initials, max 2 chars. Single word → first 2 letters. */
export function getInitials(name: string | null | undefined): string {
  const parts = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '?';

  if (parts.length === 1) {
    const word = parts[0];
    return word.slice(0, 2).toUpperCase();
  }

  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1][0] ?? '';
  return `${first}${last}`.toUpperCase();
}
