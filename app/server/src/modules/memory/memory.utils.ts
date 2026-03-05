export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags || tags.length === 0) return [];

  const normalizedTags = tags
    .map((tag) => {
      return tag.trim().toLowerCase();
    })
    .filter((tag) => tag.length > 1);

  return [...new Set(normalizedTags)];
}
