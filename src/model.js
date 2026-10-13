import raw from './data.json'

export const FEATURES = [
  { key: 'Fertilizer', label: 'Fertilizer', unit: 'kg/ha', idx: 0 },
  { key: 'temp', label: 'Temperature', unit: '°C', idx: 1 },
  { key: 'N', label: 'Nitrogen (N)', unit: 'kg/ha', idx: 2 },
  { key: 'P', label: 'Phosphorus (P)', unit: 'kg/ha', idx: 3 },
  { key: 'K', label: 'Potassium (K)', unit: 'kg/ha', idx: 4 },
]

export const rows = raw // [Fertilizer, temp, N, P, K, yield]
const D = FEATURES.length

const col = (i) => rows.map((r) => r[i])
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))) || 1 }

export const stats = FEATURES.concat([{ key: 'yield', label: 'Yield', idx: 5 }]).map((f) => {
  const c = col(f.idx)
  return { ...f, min: Math.min(...c), max: Math.max(...c), mean: mean(c), std: std(c) }
})
const mu = stats.slice(0, D).map((s) => s.mean)
const sd = stats.slice(0, D).map((s) => s.std)
export const featureStats = stats.slice(0, D)
export const yieldStats = stats[D]

const norm = (x) => x.map((v, i) => (v - mu[i]) / sd[i])
const Z = rows.map((r) => norm(r.slice(0, D)))
const Y = rows.map((r) => r[D])

// k-nearest-neighbours regression (distance weighted) on standardised inputs
export function predict(input, k = 5, Zs = Z, Ys = Y) {
  const q = norm(input)
  const d = Zs.map((z, i) => {
    let s = 0
    for (let j = 0; j < D; j++) s += (z[j] - q[j]) ** 2
    return { i, dist: Math.sqrt(s) }
  })
  d.sort((a, b) => a.dist - b.dist)
  const nn = d.slice(0, k)
  let w = 0, sum = 0
  for (const n of nn) { const wt = 1 / (n.dist + 1e-6); w += wt; sum += wt * Ys[n.i] }
  return { value: sum / w, neighbours: nn.map((n) => ({ ...n, row: rows[n.i] })) }
}

// How far outside the training range is the input? (normalised distance to the nearest sample)
export function novelty(input) {
  const { neighbours } = predict(input, 1)
  return neighbours[0].dist
}

export function band(y) {
  if (y < 7) return 'low'
  if (y < 9) return 'medium'
  if (y < 11) return 'high'
  return 'very_high'
}
export const BANDS = {
  low: { label: 'Low', range: 'below 7', color: '#b4691f' },
  medium: { label: 'Medium', range: '7 – 9', color: '#8a9a2b' },
  high: { label: 'High', range: '9 – 11', color: '#3f9142' },
  very_high: { label: 'Very high', range: 'above 11', color: '#1d6b3a' },
}

// Held-out evaluation (seeded shuffle, 80/20) so the UI can report honest accuracy.
function seeded(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296 }
export const evaluation = (() => {
  const rnd = seeded(42)
  const idx = rows.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1));[idx[i], idx[j]] = [idx[j], idx[i]] }
  const cut = Math.floor(idx.length * 0.8)
  const tr = idx.slice(0, cut), te = idx.slice(cut)
  const Zt = tr.map((i) => Z[i]), Yt = tr.map((i) => Y[i])
  let se = 0, ae = 0
  const my = mean(te.map((i) => Y[i]))
  let ss = 0
  const points = []
  for (const i of te) {
    const p = predict(rows[i].slice(0, D), 5, Zt, Yt).value
    se += (p - Y[i]) ** 2; ae += Math.abs(p - Y[i]); ss += (Y[i] - my) ** 2
    if (points.length < 250) points.push({ actual: +Y[i].toFixed(2), predicted: +p.toFixed(2) })
  }
  return { r2: 1 - se / ss, rmse: Math.sqrt(se / te.length), mae: ae / te.length, n: te.length, points }
})()

export function correlations() {
  const y = col(D)
  return FEATURES.map((f) => {
    const x = col(f.idx), mx = mean(x), my = mean(y)
    let num = 0, a = 0, b = 0
    for (let i = 0; i < x.length; i++) { num += (x[i] - mx) * (y[i] - my); a += (x[i] - mx) ** 2; b += (y[i] - my) ** 2 }
    return { label: f.label, key: f.key, r: num / Math.sqrt(a * b) }
  })
}

export function histogram(bins = 14) {
  const { min, max } = yieldStats
  const w = (max - min) / bins
  const out = Array.from({ length: bins }, (_, i) => ({ x: +(min + i * w + w / 2).toFixed(1), count: 0 }))
  for (const y of Y) out[Math.min(bins - 1, Math.floor((y - min) / w))].count++
  return out
}

export function scatter(featureIdx, max = 500) {
  const step = Math.ceil(rows.length / max)
  return rows.filter((_, i) => i % step === 0).map((r) => ({ x: r[featureIdx], y: +r[D].toFixed(2) }))
}

// What-if: change one input across its range, hold the others.
export function sensitivity(input, f) {
  const s = featureStats[f.idx]
  return Array.from({ length: 21 }, (_, i) => {
    const v = s.min + ((s.max - s.min) * i) / 20
    const x = input.slice(); x[f.idx] = v
    return { x: +v.toFixed(1), y: +predict(x).value.toFixed(2) }
  })
}

export const PRESETS = {
  'Poor season': [52, 39, 60, 17, 14],
  'Typical': [65, 37, 70, 20.5, 18],
  'Ideal': [79, 28, 79, 24, 21],
}

export const CLASS_FILES = Object.fromEntries(
  Object.keys(BANDS).map((c) => [c, Array.from({ length: 12 }, (_, i) => `dataset/${c}/${c}_${String(i + 1).padStart(2, '0')}.png`)])
)
