import { rows, FEATURES, featureStats, predict, band } from './model.js'

// Controllable inputs (farmer can change these). Temperature is weather, so it gets advice, not a "set value".
const CONTROLLABLE = FEATURES.filter((f) => f.key !== 'temp')
const MAX_RAISE = 0.2 // never suggest raising an input by more than 20% in one go (keeps advice realistic)

// Profile of the best fields in the dataset (yield >= 9)
const best = rows.filter((r) => r[5] >= 9)
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))) }
export const topProfile = FEATURES.map((f) => {
  const c = best.map((r) => r[f.idx])
  return { ...f, mean: mean(c), std: sd(c), lo: mean(c) - sd(c), hi: mean(c) + sd(c) }
})

// Best single change for one controllable input, within the safe cap.
function bestMove(vals, f) {
  const cur = vals[f.idx]
  const cap = Math.min(featureStats[f.idx].max, cur * (1 + MAX_RAISE))
  const base = predict(vals).value
  let top = { value: cur, yield: base }
  for (let i = 1; i <= 10; i++) {
    const v = cur + ((cap - cur) * i) / 10
    const x = vals.slice(); x[f.idx] = v
    const y = predict(x).value
    if (y > top.yield + 1e-9) top = { value: v, yield: y }
  }
  return { f, from: cur, to: top.value, gain: top.yield - base, yield: top.yield }
}

const HEAT_TIPS = [
  'Irrigate in the early morning or evening so the crop loses less water in the heat.',
  'Use mulch (straw/leaf cover) to keep the soil cool and hold moisture.',
  'If possible, shift sowing time or choose a heat-tolerant variety for the next season.',
]

export function getSuggestions(vals, y) {
  const b = band(y)
  const actions = []

  // 1) Data-driven "quick wins": which controllable input raises predicted yield the most?
  for (const m of CONTROLLABLE.map((f) => bestMove(vals, f)).sort((a, c) => c.gain - a.gain)) {
    if (m.gain >= 0.15) {
      actions.push({
        kind: 'increase',
        title: `Increase ${m.f.label} from ${m.from.toFixed(1)} to ${m.to.toFixed(1)} ${m.f.unit}`,
        detail: `Records with similar conditions and this higher ${m.f.label} gave about ${m.gain.toFixed(2)} more yield.`,
        gain: m.gain,
      })
    }
  }

  // 2) Temperature advice (cannot be "set", so give mitigation tips)
  const tp = topProfile.find((p) => p.key === 'temp')
  const t = vals[1]
  if (t > tp.hi) {
    actions.push({
      kind: 'heat',
      title: `Temperature (${t.toFixed(1)}°C) is hotter than your best fields (~${tp.mean.toFixed(0)}°C)`,
      detail: HEAT_TIPS.join(' '),
      gain: null,
    })
  }

  // 3) Combined plan: greedy, up to 3 steps, apply best move each round
  let plan = vals.slice(), py = y
  for (let r = 0; r < 3; r++) {
    const m = CONTROLLABLE.map((f) => bestMove(plan, f)).sort((a, c) => c.gain - a.gain)[0]
    if (!m || m.gain < 0.1) break
    plan[m.f.idx] = m.to
    py = m.yield
  }
  const planGain = py - y

  // 4) Compare each input with the best fields
  const gaps = FEATURES.map((f, i) => {
    const p = topProfile[i]
    const v = vals[i]
    let status = 'ok'
    if (v < p.lo) status = 'low'
    else if (v > p.hi) status = 'high'
    return { label: f.label, unit: f.unit, key: f.key, value: v, lo: p.lo, hi: p.hi, status }
  })

  const headline = {
    low: 'Yield is low. The inputs below are the biggest reasons, so start there.',
    medium: 'Yield is average. A few small changes can push it into the high band.',
    high: 'Yield is good. Keep the current plan and make only small improvements.',
    very_high: 'Excellent yield. Your inputs are close to the best fields in the data, so maintain them.',
  }[b]

  const nothing = actions.length === 0
  return {
    headline,
    actions,
    gaps,
    plan: planGain >= 0.1 ? { vals: plan, yield: py, gain: planGain } : null,
    maintain: nothing ? 'No single change gives a clear gain, so keep the current values and watch the weather.' : null,
  }
}
