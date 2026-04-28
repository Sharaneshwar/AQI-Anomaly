import { marked } from "marked";
import DOMPurify from "dompurify";

// Token format:
//   [[TABLE:<name>]]                  → table fallback
//   [[CHART:<name>]]                  → chart, type from tool's chart_hint or "line"
//   [[CHART:<name>:<type>]]           → chart, explicit type override
const TOKEN_RE = /\[\[(TABLE|CHART):([A-Za-z0-9_]+)(?::([a-z_]+))?\]\]/g;

export function findTokens(text) {
  if (!text) return [];
  const out = [];
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(text))) {
    out.push({
      kind: m[1].toLowerCase(),
      name: m[2],
      type: m[3] || null, // optional explicit chart type
      index: m.index,
    });
  }
  return out;
}

export function stripTokens(text) {
  if (!text) return "";
  return text.replace(TOKEN_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

// Tiny LRU so repeat renders of the same `text` (cross-component, common
// during streaming when both Message body and AgenticAccordion may render
// the same string) don't re-parse markdown. Max ~64 entries; FIFO evict.
const _MD_CACHE = new Map();
const _MD_MAX = 64;

export function renderMarkdown(text) {
  const key = text || "";
  const hit = _MD_CACHE.get(key);
  if (hit !== undefined) return hit;
  const html = marked.parse(key, { breaks: true, gfm: true });
  const safe = DOMPurify.sanitize(html);
  if (_MD_CACHE.size >= _MD_MAX) {
    const oldest = _MD_CACHE.keys().next().value;
    _MD_CACHE.delete(oldest);
  }
  _MD_CACHE.set(key, safe);
  return safe;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

export function looksLikeDate(v) {
  if (v instanceof Date) return true;
  if (typeof v === "string") return ISO_RE.test(v);
  return false;
}

// ---------- axis detection helpers (one per chart family) -------------------

// For line / area charts — first datetime-like column on x, numeric on y,
// optional groupCol = "deviceid" for one-line-per-site.
export function detectAxes(rows) {
  if (!rows || !rows.length) return null;
  const cols = Object.keys(rows[0]);
  const samples = rows.slice(0, Math.min(rows.length, 5));

  const xCol =
    cols.find((c) => samples.every((r) => r[c] == null || looksLikeDate(r[c]))) ||
    cols.find((c) => samples.some((r) => looksLikeDate(r[c])));

  const groupCol = cols.includes("deviceid") ? "deviceid" : null;
  const yCols = cols.filter((c) => {
    if (c === xCol || c === groupCol) return false;
    return samples.some((r) => typeof r[c] === "number");
  });

  return { xCol, yCols, groupCol };
}

// For bar / grouped_bar / hbar / stacked_bar — categorical x (deviceid by
// default, falls back to first non-numeric column), numeric y series.
export function detectCategoryAxes(rows, { categoryCol } = {}) {
  if (!rows || !rows.length) return null;
  const cols = Object.keys(rows[0]);
  const samples = rows.slice(0, Math.min(rows.length, 5));

  const cat =
    categoryCol ||
    (cols.includes("deviceid") ? "deviceid" : null) ||
    (cols.includes("severity") ? "severity" : null) ||
    cols.find((c) => samples.every((r) => typeof r[c] !== "number"));

  const yCols = cols.filter((c) => {
    if (c === cat) return false;
    if (c === "bucket" || c === "hour" || c === "sample_count") return false;
    return samples.some((r) => typeof r[c] === "number");
  });

  return { categoryCol: cat, yCols };
}

// For scatter — first two numeric columns become x and y. Group by deviceid.
export function detectScatterAxes(rows) {
  if (!rows || !rows.length) return null;
  const cols = Object.keys(rows[0]);
  const samples = rows.slice(0, Math.min(rows.length, 5));
  const numericCols = cols.filter((c) =>
    samples.some((r) => typeof r[c] === "number"),
  );
  const xCol = numericCols[0] || null;
  const yCol = numericCols[1] || null;
  const groupCol = cols.includes("deviceid") ? "deviceid" : null;
  return { xCol, yCol, groupCol };
}

// For doughnut — first non-numeric column is the label, first numeric is value.
export function detectShareAxes(rows) {
  if (!rows || !rows.length) return null;
  const cols = Object.keys(rows[0]);
  const samples = rows.slice(0, Math.min(rows.length, 5));
  const labelCol = cols.find((c) =>
    samples.every((r) => typeof r[c] !== "number"),
  );
  const valueCol = cols.find((c) => samples.some((r) => typeof r[c] === "number"));
  return { labelCol, valueCol };
}

// Resolve the effective chart type:
//   1. explicit suffix (token.type)
//   2. tool default (table.chart_hint)
//   3. fallback to "line"
export function resolveChartType(token, tableMeta) {
  return token?.type || tableMeta?.chart_hint || "line";
}
