#!/usr/bin/env node
/**
 * Fails the build when a Tailwind colour utility references a token that does not exist
 * in the theme.
 *
 * WHY THIS EXISTS
 * Tailwind silently drops unknown utilities. `bg-brand-wash` with no `brand-wash` token
 * emits NOTHING — no error, no warning, no CSS. `npm run build` passes, `tsc` passes, and
 * the element renders with no background. During the v5 migration this produced dead
 * classes across 40+ files before anyone noticed, because every automated check was green.
 *
 * A design system with no enforcement is a suggestion. This is the enforcement.
 *
 * Usage:  node scripts/check-design-tokens.mjs
 * Wired into `npm run lint` and CI.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC = 'src';
const CONFIG = 'tailwind.config.ts';

// Utilities that take a colour token.
const COLOR_PREFIXES = [
  'bg', 'text', 'border', 'ring', 'divide', 'placeholder',
  'outline', 'fill', 'stroke', 'from', 'to', 'via', 'caret', 'decoration',
];

// Variants that may precede a utility.
const VARIANT = String.raw`(?:[a-z-]+:)*`;

/** Keys of a named block in the config, e.g. `fontSize:` or `boxShadow:`. */
function blockKeys(cfg, name) {
  const start = cfg.indexOf(`${name}:`);
  if (start === -1) return [];
  // Walk to the matching close brace so we don't swallow later blocks.
  let depth = 0, i = cfg.indexOf('{', start);
  const from = i;
  for (; i < cfg.length; i++) {
    if (cfg[i] === '{') depth++;
    else if (cfg[i] === '}' && --depth === 0) break;
  }
  return [...cfg.slice(from, i).matchAll(/^\s*'?([a-zA-Z0-9-]+)'?\s*:/gm)].map((m) => m[1]);
}

/**
 * Tokens a colour-prefixed utility may legitimately reference.
 *
 * Not just `colors` — `text-title` is a fontSize and `shadow-hard` is a boxShadow. A
 * checker that reports those as errors will be switched off within a day, and then it
 * protects nothing. Accuracy is what keeps it alive.
 */
function definedTokens() {
  const cfg = readFileSync(CONFIG, 'utf8');
  const colorBlock = cfg.slice(cfg.indexOf('colors:'), cfg.indexOf('extend:'));
  const tokens = new Set(['transparent', 'current', 'inherit', 'white', 'black']);
  for (const m of colorBlock.matchAll(/^\s*'?([a-zA-Z0-9-]+)'?\s*:/gm)) tokens.add(m[1]);
  for (const k of blockKeys(cfg, 'fontSize')) tokens.add(k);
  for (const k of blockKeys(cfg, 'boxShadow')) tokens.add(k);
  tokens.delete('colors');
  return tokens;
}

/** Non-colour values that legitimately follow a colour-ish prefix. */
const NOT_COLORS = new Set([
  // text-* sizing / alignment / wrapping
  'xs','sm','base','lg','xl','2xl','3xl','4xl','5xl','6xl','7xl','8xl','9xl',
  'left','center','right','justify','start','end','wrap','nowrap','balance','pretty',
  'clip','ellipsis','top','bottom','middle','super','sub',
  // border / ring / outline widths and styles
  '0','1','2','3','4','8','solid','dashed','dotted','double','hidden','none','offset',
  'collapse','separate','x','y','t','b','l','r','s','e','inset','spacing','radius',
  // bg-* non-colour
  'cover','contain','fixed','local','scroll','repeat','no','auto','opacity','blend',
  'origin','clip','position','size','gradient','image','norepeat',
  // misc
  'transparent','current','inherit','underline','overline','line',
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (['.tsx', '.ts', '.jsx', '.js', '.html', '.css'].includes(extname(p))) out.push(p);
  }
  return out;
}

const defined = definedTokens();
const pattern = new RegExp(
  String.raw`\b${VARIANT}(${COLOR_PREFIXES.join('|')})-([a-z][a-zA-Z0-9-]*)\b`,
  'g'
);

const offences = new Map(); // token -> Set of "file:line"

for (const file of walk(SRC)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(pattern)) {
      const token = m[2];
      const head = token.split('-')[0];
      if (NOT_COLORS.has(token) || NOT_COLORS.has(head)) continue;
      if (/^\d/.test(token)) continue;
      if (defined.has(token)) continue;
      // A token may be a compound like accent-wash; check the full form only.
      if (!offences.has(token)) offences.set(token, new Set());
      offences.get(token).add(`${file}:${i + 1}`);
    }
  });
}

if (offences.size === 0) {
  console.log(`✓ design tokens: every colour utility in ${SRC}/ resolves to a theme token`);
  process.exit(0);
}

console.error('\n  UNDEFINED DESIGN TOKENS\n');
console.error('  These Tailwind utilities reference tokens that do not exist in');
console.error(`  ${CONFIG}. Tailwind emits NO CSS for them, so they render as nothing:`);
console.error('  no background, no colour, no border. Nothing else will catch this.\n');

const sorted = [...offences.entries()].sort((a, b) => b[1].size - a[1].size);
for (const [token, places] of sorted) {
  console.error(`  ${token.padEnd(20)} ${String(places.size).padStart(3)} occurrence(s)`);
  for (const place of [...places].slice(0, 3)) console.error(`      ${place}`);
  if (places.size > 3) console.error(`      … and ${places.size - 3} more`);
}

console.error(`\n  Defined tokens: ${[...defined].sort().join(', ')}`);
console.error('\n  Mapping from the v4 palette is in design/v5/TOKEN_MIGRATION.md.');
console.error('  Do NOT add aliases for the old names — migrate the class names.\n');
process.exit(1);
