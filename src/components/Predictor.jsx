import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from 'recharts'
import Suggestions from './Suggestions.jsx'
import { FEATURES, featureStats, predict, band, BANDS, PRESETS, CLASS_FILES, novelty, sensitivity, yieldStats } from '../model.js'

export default function Predictor() {
  const [vals, setVals] = useState(PRESETS['Typical'])
  const [pick, setPick] = useState(0)
  const [focus, setFocus] = useState(FEATURES[2])

  const set = (i, v) => setVals((p) => p.map((x, j) => (j === i ? v : x)))
  const result = useMemo(() => predict(vals), [vals])
  const sens = useMemo(() => sensitivity(vals, focus), [vals, focus])
  const far = novelty(vals)
  const y = result.value
  const b = band(y)
  const pct = Math.max(0, Math.min(100, ((y - yieldStats.min) / (yieldStats.max - yieldStats.min)) * 100))
  const img = CLASS_FILES[b][pick % 12]

  return (
    <div className="grid two">
      <section className="card">
        <div className="card-h">
          <h2>Field conditions</h2>
          <div className="chips">
            {Object.keys(PRESETS).map((k) => (
              <button key={k} className="chip" onClick={() => setVals(PRESETS[k])}>{k}</button>
            ))}
          </div>
        </div>
        {FEATURES.map((f, i) => {
          const s = featureStats[f.idx]
          const step = (s.max - s.min) / 200
          return (
            <div className="field" key={f.key}>
              <label htmlFor={f.key}>{f.label} <small>{f.unit}</small></label>
              <input id={f.key} type="range" min={s.min} max={s.max} step={step} value={vals[i]} onChange={(e) => set(i, +e.target.value)} />
              <input className="num" type="number" step="0.1" value={+vals[i].toFixed(1)} onChange={(e) => set(i, +e.target.value || 0)} aria-label={`${f.label} value`} />
            </div>
          )
        })}
        {far > 1.2 && (
          <p className="warn">These values sit outside the range the dataset covers, so the estimate is less reliable.</p>
        )}
      </section>

      <section className="card result">
        <h2>Predicted yield</h2>
        <div className="big" style={{ color: BANDS[b].color }}>{y.toFixed(2)}</div>
        <div className="pill" style={{ background: BANDS[b].color }}>{BANDS[b].label} yield</div>
        <div className="meter" aria-hidden>
          <div className="meter-fill" style={{ width: pct + '%', background: BANDS[b].color }} />
        </div>
        <div className="meter-l"><span>{yieldStats.min.toFixed(1)}</span><span>dataset range</span><span>{yieldStats.max.toFixed(1)}</span></div>

        <figure className="fieldimg">
          <img src={img} alt={`${BANDS[b].label} yield field sample`} />
          <figcaption>
            Matching field sample · class “{b.replace('_', ' ')}” ({BANDS[b].range})
            <button className="link" onClick={() => setPick((p) => p + 1)}>Next image</button>
          </figcaption>
        </figure>
      </section>

      <section className="card">
        <div className="card-h">
          <h2>What if you change one input?</h2>
          <select value={focus.key} onChange={(e) => setFocus(FEATURES.find((f) => f.key === e.target.value))}>
            {FEATURES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={sens} margin={{ top: 8, right: 12, bottom: 8, left: -8 }}>
              <CartesianGrid stroke="#e7e2d6" vertical={false} />
              <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} tick={{ fontSize: 12 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [v, 'Yield']} labelFormatter={(l) => `${focus.label}: ${l}`} />
              <Line type="monotone" dataKey="y" stroke="#2f7d3a" strokeWidth={2.5} dot={false} />
              <ReferenceDot x={+vals[focus.idx].toFixed(1)} y={+y.toFixed(2)} r={6} fill={BANDS[b].color} stroke="#fff" ifOverflow="extendDomain" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="muted">Other inputs are held at your current values. The dot marks the current prediction.</p>
      </section>

      <section className="card">
        <h2>Closest historical records</h2>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Fert.</th><th>Temp</th><th>N</th><th>P</th><th>K</th><th>Yield</th></tr></thead>
            <tbody>
              {result.neighbours.map((n) => (
                <tr key={n.i}>{n.row.map((v, j) => <td key={j} className={j === 5 ? 'strong' : ''}>{v.toFixed(1)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">The prediction is the distance-weighted average yield of these five records.</p>
      </section>

      <Suggestions vals={vals} y={y} onApply={setVals} />
    </div>
  )
}
