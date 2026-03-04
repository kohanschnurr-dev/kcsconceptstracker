/**
 * Safe arithmetic expression evaluator.
 * Supports: +, -, *, /, parentheses, decimals, negative numbers.
 * Returns null for anything it can't parse.
 *
 * Implemented as a recursive descent parser — no eval() or Function() constructor.
 *
 * Usage: evaluateFormula("22489-10000") → 12489
 */
export function evaluateFormula(expr: string): number | null {
  const cleaned = expr.replace(/^=/, '').replace(/\s/g, '');
  if (!cleaned) return null;

  // Only allow digits, operators, parens, decimal points
  if (!/^[\d+\-*/().]+$/.test(cleaned)) return null;

  try {
    const result = parseExpr(cleaned, { pos: 0 });
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

// ── Recursive descent parser ──────────────────────────────────────────────────
// Grammar:
//   expr   → term   (('+' | '-') term)*
//   term   → factor (('*' | '/') factor)*
//   factor → '-' factor | '(' expr ')' | number

interface Cursor { pos: number }

function parseExpr(s: string, c: Cursor): number {
  let result = parseTerm(s, c);
  while (c.pos < s.length && (s[c.pos] === '+' || s[c.pos] === '-')) {
    const op = s[c.pos++];
    const right = parseTerm(s, c);
    result = op === '+' ? result + right : result - right;
  }
  return result;
}

function parseTerm(s: string, c: Cursor): number {
  let result = parseFactor(s, c);
  while (c.pos < s.length && (s[c.pos] === '*' || s[c.pos] === '/')) {
    const op = s[c.pos++];
    const right = parseFactor(s, c);
    if (op === '/' && right === 0) throw new Error('Division by zero');
    result = op === '*' ? result * right : result / right;
  }
  return result;
}

function parseFactor(s: string, c: Cursor): number {
  if (c.pos >= s.length) throw new Error('Unexpected end of expression');

  // Unary minus
  if (s[c.pos] === '-') {
    c.pos++;
    return -parseFactor(s, c);
  }

  // Parenthesised sub-expression
  if (s[c.pos] === '(') {
    c.pos++; // consume '('
    const result = parseExpr(s, c);
    if (s[c.pos] !== ')') throw new Error('Missing closing parenthesis');
    c.pos++; // consume ')'
    return result;
  }

  // Number literal
  const start = c.pos;
  while (c.pos < s.length && /[\d.]/.test(s[c.pos])) c.pos++;
  if (c.pos === start) throw new Error(`Unexpected character: ${s[c.pos]}`);
  return parseFloat(s.slice(start, c.pos));
}
