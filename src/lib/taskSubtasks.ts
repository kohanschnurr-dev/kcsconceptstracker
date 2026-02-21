const DELIMITER = '---LINE_ITEMS---';

export interface Subtask {
  text: string;
  done: boolean;
}

export function parseDescription(raw: string | null): { description: string; subtasks: Subtask[] } {
  if (!raw) return { description: '', subtasks: [] };
  const idx = raw.indexOf(DELIMITER);
  if (idx === -1) return { description: raw, subtasks: [] };
  const description = raw.slice(0, idx).trim();
  const jsonPart = raw.slice(idx + DELIMITER.length).trim();
  try {
    const parsed = JSON.parse(jsonPart);
    if (Array.isArray(parsed)) {
      const subtasks: Subtask[] = parsed.map((item) => {
        if (typeof item === 'string') return { text: item, done: false };
        if (item && typeof item === 'object' && 'text' in item) {
          return { text: String(item.text), done: !!item.done };
        }
        return { text: String(item), done: false };
      });
      return { description, subtasks };
    }
  } catch {
    // ignore parse errors
  }
  return { description: raw, subtasks: [] };
}

export function serializeDescription(description: string, subtasks: Subtask[]): string {
  const filtered = subtasks.filter((s) => s.text.trim().length > 0);
  if (filtered.length === 0) return description;
  return `${description}\n${DELIMITER}\n${JSON.stringify(filtered)}`;
}
