import { useMemo, useState } from 'react'
import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { FEATURES, stats, correlations, histogram, scatter, evaluation } from '../model.js'

export default function Explorer() {
  const [f, setF] = useState(FEATURES[1])
  const corr = useMemo(correlations, [])
  const hist = useMemo(() => histogram(), [])
  const sc = useMemo(() => scatter(f.idx), [f])

  return (
    <div className="grid two">
      <section className="card">
        <h2>Model accuracy</h2>
        <div className="kpis">
          <div><b>{evaluation.r2.toFixed(3)}</b><span>R² (20% held out)</span></div>
          <div><b>{evaluation.rmse.toFixed(2)}</b><span>RMSE</span></div>
          <div><b>{evaluation.mae.toFixed(2)}</b><span>Mean abs. error</span></div>
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={230}>
            <ScatterChart margin={{ top: 8, right: 12, bottom: 18, left: -8 }}>
              <CartesianGrid stroke="#e7e2d6" />
              <XAxis dataKey="actual" name="Actual" type="number" domain={['auto', 'auto']} tick={{ fontSize: 12 }} label={{ value: 'Actual yield', position: 'insideBottom', offset: -10, fontSize: 12 }} />
              <YAxis dataKey="predicted" name="Predicted" type="number" domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={evaluation.points} fill="#2f7d3a" fillOpacity={0.55} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="muted">Each dot is a record the model never saw; points on the diagonal are perfect predictions.</p>
      </section>

      <section className="card">
        <h2>Yield distribution</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={hist} margin={{ top: 8, right: 12, bottom: 8, left: -8 }}>
              <CartesianGrid stroke="#e7e2d6" vertical={false} />
              <XAxis dataKey="x" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [v, 'Records']} labelFormatter={(l) => `Yield ≈ ${l}`} />
              <Bar dataKey="count" fill="#6aa84f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <h2>Correlation with yield</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={corr} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 24 }}>
              <CartesianGrid stroke="#e7e2d6" horizontal={false} />
              <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [v.toFixed(3), 'Pearson r']} />
              <Bar dataKey="r" radius={4}>
                {corr.map((c) => <Cell key={c.key} fill={c.r < 0 ? '#c0682b' : '#2f7d3a'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="muted">Higher temperature goes with lower yield; more N, K, P and fertilizer go with higher yield.</p>
      </section>

      <section className="card">
        <div className="card-h">
          <h2>Yield vs input</h2>
          <select value={f.key} onChange={(e) => setF(FEATURES.find((x) => x.key === e.target.value))}>
            {FEATURES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
          </select>
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 8, right: 12, bottom: 18, left: -8 }}>
              <CartesianGrid stroke="#e7e2d6" />
              <XAxis dataKey="x" type="number" domain={['auto', 'auto']} name={f.label} tick={{ fontSize: 12 }} label={{ value: `${f.label} (${f.unit})`, position: 'insideBottom', offset: -10, fontSize: 12 }} />
              <YAxis dataKey="y" type="number" domain={['auto', 'auto']} name="Yield" tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={sc} fill="#2f7d3a" fillOpacity={0.45} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card span2">
        <h2>Dataset summary</h2>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Variable</th><th>Min</th><th>Mean</th><th>Max</th><th>Std dev</th></tr></thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.key}><td>{s.label}</td><td>{s.min.toFixed(1)}</td><td>{s.mean.toFixed(1)}</td><td>{s.max.toFixed(1)}</td><td>{s.std.toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
