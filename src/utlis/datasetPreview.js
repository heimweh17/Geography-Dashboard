export const parseFileToPoints = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const name = (file.name || '').toLowerCase();
        const text = reader.result;
        if (name.endsWith('.csv')) {
          resolve(parseCsvPoints(String(text)));
        } else {
          resolve(parseGeojsonPoints(String(text)));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

const parseCsvPoints = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim());
  const idx = normalizeLatLonKeys(header);
  if (!idx.lat || !idx.lon) return [];
  const catIdx = findCategoryKey(header);
  const points = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const get = (key) => {
      const pos = header.indexOf(key);
      return pos >= 0 ? cols[pos] : undefined;
    };
    const lat = parseFloat(get(idx.lat));
    const lon = parseFloat(get(idx.lon));
    if (!isFinite(lat) || !isFinite(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
    const category = catIdx ? get(catIdx) : undefined;
    points.push({ lat, lon, category: category || undefined });
  }
  return points;
};

const normalizeLatLonKeys = (headers) => {
  const lower = headers.map((h) => h.trim().toLowerCase());
  const map = {};
  const latC = ['lat', 'latitude', 'y'];
  const lonC = ['lon', 'lng', 'long', 'longitude', 'x'];
  for (let i = 0; i < lower.length; i++) {
    if (latC.includes(lower[i]) && !map.lat) map.lat = headers[i];
    if (lonC.includes(lower[i]) && !map.lon) map.lon = headers[i];
  }
  return map;
};

const findCategoryKey = (headers) => {
  const lower = headers.map((h) => h.trim().toLowerCase());
  const idx = lower.indexOf('category');
  return idx >= 0 ? headers[idx] : null;
};

const splitCsvLine = (line) => {
  // Simple CSV splitter; assumes no escaped commas within quotes for MVP
  // Works for common simple CSVs; not a full CSV parser to keep deps minimal
  const parts = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' ) {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((p) => p.trim().replace(/^"|"$/g, ''));
};

const parseGeojsonPoints = (text) => {
  try {
    const data = JSON.parse(text);
    if (data.type !== 'FeatureCollection') return [];
    const feats = Array.isArray(data.features) ? data.features : [];
    const pts = [];
    for (const f of feats) {
      const g = f.geometry || {};
      if (g.type !== 'Point') continue;
      const coords = g.coordinates || [];
      if (!Array.isArray(coords) || coords.length < 2) continue;
      const lon = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!isFinite(lat) || !isFinite(lon)) continue;
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
      const category = f.properties?.category;
      pts.push({ lat, lon, category });
    }
    return pts;
  } catch {
    return [];
  }
};
