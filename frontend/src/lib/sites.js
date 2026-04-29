// Lazy-load /sites.json once and cache. The chat map component uses this
// to resolve site_ids → {lat, lon, name, city} without a backend call.
//
// shape of one entry:
//   { id: "site_104", name: "...", city: "Delhi", lat: 28.7256, lon: 77.2011 }

let _cache = null;
let _byId = null;
let _promise = null;

async function _load() {
  if (_promise) return _promise;
  // Served from frontend/public/data/sites.json. We avoid /sites* root
  // because the vite dev proxy forwards anything under /sites to the
  // backend, which 404s for static JSON. /data/* is safe.
  _promise = fetch("/data/sites.json")
    .then((r) => {
      if (!r.ok) throw new Error(`sites.json HTTP ${r.status}`);
      return r.json();
    })
    .then((rows) => {
      _cache = Array.isArray(rows) ? rows : [];
      _byId = Object.fromEntries(_cache.map((r) => [r.id, r]));
      return _cache;
    })
    .catch((err) => {
      _promise = null; // allow retry later
      throw err;
    });
  return _promise;
}

export async function getAllSites() {
  if (_cache) return _cache;
  return _load();
}

export async function getSite(id) {
  if (_byId) return _byId[id] || null;
  await _load();
  return _byId ? _byId[id] || null : null;
}

// Sync access; returns null until _load resolves. Useful in render paths
// where the caller is already reacting to a state update once data lands.
export function getSiteSync(id) {
  return _byId ? _byId[id] || null : null;
}

export function isLoaded() {
  return _byId !== null;
}

// Match `site_<digits>` standalone tokens. Skips matches that are part of
// a longer identifier (e.g. "site_5129abc" is rejected) by checking
// boundaries. Returns deduped Array.
export function extractSiteIds(text) {
  if (!text) return [];
  const out = new Set();
  const re = /\bsite_\d+\b/g;
  let m;
  while ((m = re.exec(text))) out.add(m[0]);
  return [...out];
}
