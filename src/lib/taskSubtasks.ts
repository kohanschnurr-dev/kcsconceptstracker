const DELIMITER = '---LINE_ITEMS---';

export function parseDescription(raw: string | null): { description: string; subtasks: string[] } {
  if (!raw) return { description: '', subtasks: [] };
  const idx = raw.indexOf(DELIMITER);
  if (idx === -1) return { description: raw, subtasks: [] };
  const description = raw.slice(0, idx).trim();
  const jsonPart = raw.slice(idx + DELIMITER.length).trim();
  try {
    const subtasks = JSON.parse(jsonPart);
    if (Array.isArray(subtasks)) return { description, subtasks: subtasks.map(String) };
  } catch {
    // ignore parse errors
  }
  return { description: raw, subtasks: [] };
}

export function serializeDescription(description: string, subtasks: string[]): string {
  const filtered = subtasks.filter((s) => s.trim().length > 0);
  if (filtered.length === 0) return description;
  return `${description}\n${DELIMITER}\n${JSON.stringify(filtered)}`;
}
