/**
 * Safe arithmetic expression evaluator.
 * Supports: +, -, *, /, parentheses, decimals, negative numbers.
 * Returns null for anything it can't parse.
 *
 * Usage: evaluateFormula("22489-10000") → 12489
 */
export function evaluateFormula(expr: string): number | null {
  // Strip the leading "="
  const cleaned = expr.replace(/^=/, '').trim();
  if (!cleaned) return null;

  // Only allow digits, operators, parens, decimals, whitespace
  if (!/^[\d\s+\-*/().]+$/.test(cleaned)) return null;

  try {
    // Use Function constructor (safer than eval, no access to outer scope)
    const result = new Function(`"use strict"; return (${cleaned})`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}
