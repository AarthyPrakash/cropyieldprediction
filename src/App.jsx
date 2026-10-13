import { useState } from 'react'
import Predictor from './components/Predictor.jsx'
import Explorer from './components/Explorer.jsx'
import Gallery from './components/Gallery.jsx'
import { evaluation, rows } from './model.js'

const TABS = [
  ['predict', 'Predict yield'],
  ['explore', 'Explore data'],
  ['gallery', 'Image dataset'],
]

export default function App() {
  const [tab, setTab] = useState('predict')
  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="logo" aria-hidden>🌾</span>
          <div>
            <h1>CropCast</h1>
            <p>Crop yield prediction from fertilizer, temperature and N-P-K</p>
          </div>
        </div>
        <div className="badges">
          <span className="badge"><b>{rows.length.toLocaleString()}</b> records</span>
          <span className="badge"><b>R² {evaluation.r2.toFixed(3)}</b> held-out</span>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </nav>

      <main>
        {tab === 'predict' && <Predictor />}
        {tab === 'explore' && <Explorer />}
        {tab === 'gallery' && <Gallery />}
      </main>

      <footer>
        Model: k-nearest-neighbours (k=5) trained in your browser on the supplied CSV. Field images are illustrated
        samples generated for this project, not photographs.
      </footer>
    </div>
  )
}
