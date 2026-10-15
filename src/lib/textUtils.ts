/** Truncate by Unicode code point so emoji surrogate pairs stay intact. */
export function truncateText(text: string, maxLength: number): string {
  let excerpt = '';
  let length = 0;

  for (const character of text) {
    if (length >= maxLength) return `${excerpt}...`;
    excerpt += character;
    length++;
  }

  return excerpt;
}
