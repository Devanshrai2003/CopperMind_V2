export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags || tags.length === 0) return [];

  const normalizedTags = tags
    .map((tag) => {
      return tag.trim().toLowerCase();
    })
    .filter((tag) => tag.length > 1);

  return [...new Set(normalizedTags)];
}

// Try To Remove The "!" Later
export function extractMemoryLinks(content: string): string[] {
  const matches = [...content.matchAll(/\[\[([^\[\]]+?)\]\]/g)];
  return [...new Set(matches.map((pair) => pair[1]!.trim().toLowerCase()))];
}
