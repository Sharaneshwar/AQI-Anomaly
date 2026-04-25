import { marked } from "marked";
import DOMPurify from "dompurify";

const TOKEN_RE = /\[\[(TABLE|CHART):([A-Za-z0-9_]+)\]\]/g;

export function findTokens(text) {
  if (!text) return [];
  const out = [];
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(text))) {
    out.push({ kind: m[1].toLowerCase(), name: m[2], index: m.index });
  }
  return out;
}

export function stripTokens(text) {
  if (!text) return "";
  return text.replace(TOKEN_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function renderMarkdown(text) {
  const html = marked.parse(text || "", { breaks: true, gfm: true });
  return DOMPurify.sanitize(html);
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

function looksLikeDate(v) {
  if (v instanceof Date) return true;
  if (typeof v === "string") return ISO_RE.test(v);
  return false;
}

export function detectAxes(rows) {
  if (!rows || !rows.length) return null;
  const cols = Object.keys(rows[0]);
  const sampleSize = Math.min(rows.length, 5);
  const samples = rows.slice(0, sampleSize);

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
