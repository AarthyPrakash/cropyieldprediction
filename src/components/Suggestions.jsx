import { useMemo } from 'react'
import { getSuggestions } from '../suggestions.js'
import { BANDS, band } from '../model.js'

const STATUS = {
  low: { text: 'Below best fields', cls: 'st-low' },
  ok: { text: 'In best range', cls: 'st-ok' },
  high: { text: 'Above best fields', cls: 'st-high' },
}

export default function Suggestions({ vals, y, onApply }) {
  const s = useMemo(() => getSuggestions(vals, y), [vals, y])
  const b = band(y)

  return (
    <section className="card span2 sugg">
      <div className="card-h">
        <h2>Suggestions to improve yield</h2>
        <span className="pill" style={{ background: BANDS[b].color }}>{BANDS[b].label}</span>
      </div>
      <p className="lead">{s.headline}</p>

      {s.actions.length > 0 ? (
        <ul className="actions">
          {s.actions.map((a, i) => (
            <li key={i} className={'act ' + a.kind}>
              <span className="ico" aria-hidden>{a.kind === 'heat' ? '🌡️' : '⬆️'}</span>
              <div>
                <strong>{a.title}</strong>
                <p>{a.detail}</p>
              </div>
              {a.gain != null && <span className="gain">+{a.gain.toFixed(2)}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ok-msg">✅ {s.maintain}</p>
      )}

      {s.plan && (
        <div className="plan">
          <div>
            <b>Combined plan:</b> apply the changes together to reach about <b>{s.plan.yield.toFixed(2)}</b> yield
            (+{s.plan.gain.toFixed(2)}).
          </div>
          <button className="btn" onClick={() => onApply(s.plan.vals)}>Apply plan to sliders</button>
        </div>
      )}

      <h3>Your values vs the best fields (yield 9+)</h3>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Input</th><th>Yours</th><th>Best-field range</th><th>Status</th></tr></thead>
          <tbody>
            {s.gaps.map((g) => (
              <tr key={g.key}>
                <td>{g.label} <small className="muted">{g.unit}</small></td>
                <td>{g.value.toFixed(1)}</td>
                <td>{g.lo.toFixed(1)} – {g.hi.toFixed(1)}</td>
                <td><span className={'st ' + STATUS[g.status].cls}>{STATUS[g.status].text}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        These suggestions come from patterns in the dataset, so they are a guide and not a guarantee. Soil, water and
        crop variety also matter, so check with your local agriculture officer before changing fertilizer doses.
      </p>
    </section>
  )
}
