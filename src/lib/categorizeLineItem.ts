// Keyword-based category detection for receipt line items.
// Order matters: more specific rules come first.
const RULES: [RegExp, string][] = [
  [/delivery|shipping|freight|haul ?away/, 'delivery_fee'],
  [/water heater|tankless/, 'water_heater'],
  [/\bdoor|prehung|pre-hung|slab|jamb|threshold|weatherstrip|door ?knob|deadbolt|lockset|hinge/, 'doors'],
  [/window|glass pane|sash/, 'windows'],
  [/trim|baseboard|casing|crown|shoe mold|quarter round|molding|moulding/, 'trims'],
  [/vanity|shower|tub\b|bathtub|medicine cabinet|towel bar|toilet paper holder/, 'bathroom'],
  [/drywall|sheetrock|joint compound|mud\b|corner bead|drywall tape/, 'drywall'],
  [/pvc|pex|cpvc|pipe|plumb|drain|p-trap|trap adapter|bath waste|toilet|faucet|shut ?off|supply line|wax ring|sharkbite|abs\b|coupling|elbow/, 'plumbing'],
  [/breaker|romex|wire\b|wiring|outlet|receptacle|gfci|switch|electrical|conduit|junction box|wire nut|panel/, 'electrical'],
  [/light|fixture|bulb|led |chandelier|sconce|ceiling fan|recessed/, 'light_fixtures'],
  [/hvac|furnace|condenser|duct|register|vent|thermostat|air filter|refrigerant/, 'hvac'],
  [/tile|thinset|grout|kerdi|cement board|backer ?board|mortar/, 'tile'],
  [/paint|primer|caulk|masking|sandpaper|roller|brush|spackle|stain\b/, 'painting'],
  [/hardwood|laminate|lvp|vinyl plank|underlayment|flooring|carpet|wall cove|transition strip/, 'flooring'],
  [/shingle|roof|drip edge|felt|ice and water|flashing|gutter/, 'roofing'],
  [/stud|2x4|2x6|2x8|2x10|2x12|lumber|osb|plywood|joist|header|framing/, 'framing'],
  [/insulation|spray foam|batt|r-?\d{2}\b/, 'insulation'],
  [/countertop|quartz|granite|butcher block/, 'countertops'],
  [/cabinet|drawer pull|cabinet knob/, 'cabinets'],
  [/refrigerator|fridge|range\b|stove|dishwasher|microwave|washer|dryer|oven|hood/, 'appliances'],
  [/fence|fencing|picket|post cap/, 'fencing'],
  [/railing|baluster|spindle|handrail/, 'railing'],
  [/concrete|quikrete|sakrete|rebar|gravel|paver/, 'driveway_concrete'],
  [/mulch|sod|plant|soil|grass seed|landscap/, 'landscaping'],
  [/siding|stucco|brick|hardie/, 'brick_siding_stucco'],
  [/cleaner|cleaning|mop|broom|bleach|paper towel/, 'cleaning'],
  [/contractor bag|trash bag|dumpster/, 'dumpsters_trash'],
  [/pest|termite|bug spray|ant bait/, 'pest_control'],
  [/permit|inspection/, 'permits'],
  [/energy drink|red bull|monster|gatorade|water bottle|snack/, 'food'],
  [/screw|nail|bolt|anchor|bit holder|blade|drive pin|glue|adhesive|tape|bracket|staple/, 'hardware'],
];

export function keywordCategory(name: string): string | null {
  const d = (name || '').toLowerCase();
  return RULES.find(([p]) => p.test(d))?.[1] ?? null;
}

export function normalizeItemKey(name: string): string {
  return (name || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** Priority: learned correction → keyword match (when AI is misc/blank) → AI guess → misc. */
export function refineCategory(name: string, aiGuess?: string | null, learned: Record<string, string> = {}): string {
  const key = normalizeItemKey(name);
  if (key && learned[key]) return learned[key];
  const guess = aiGuess && aiGuess !== 'misc' ? aiGuess : null;
  return guess || keywordCategory(name) || 'misc';
}

const STORAGE_KEY = 'receipt-category-corrections';

export function loadCorrections(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

export function saveCorrections(entries: { name: string; category: string }[]) {
  const map = loadCorrections();
  for (const { name, category } of entries) {
    const key = normalizeItemKey(name);
    if (key && category) { delete map[key]; map[key] = category; }
  }
  const keys = Object.keys(map);
  const trimmed = Object.fromEntries(keys.slice(Math.max(0, keys.length - 500)).map(k => [k, map[k]]));
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch { /* ignore */ }
}
