import { useState } from 'react'
import { BANDS, CLASS_FILES } from '../model.js'

export default function Gallery() {
  const [cls, setCls] = useState('all')
  const [open, setOpen] = useState(null)
  const list = Object.keys(BANDS)
    .filter((c) => cls === 'all' || c === cls)
    .flatMap((c) => CLASS_FILES[c].map((src) => ({ src, c })))

  return (
    <section className="card">
      <div className="card-h">
        <h2>Crop field image dataset <small>{list.length} images</small></h2>
        <div className="chips">
          <button className={'chip ' + (cls === 'all' ? 'on' : '')} onClick={() => setCls('all')}>All</button>
          {Object.entries(BANDS).map(([k, v]) => (
            <button key={k} className={'chip ' + (cls === k ? 'on' : '')} onClick={() => setCls(k)}>{v.label} ({v.range})</button>
          ))}
        </div>
      </div>
      <p className="muted">
        Four classes that line up with the yield bands in the CSV, 12 images each. They are procedurally drawn field
        illustrations, so they show the look of sparse, stressed crops versus dense, healthy ones. The labels are in <code>public/dataset/labels.csv</code>.
      </p>
      <div className="gallery">
        {list.map(({ src, c }) => (
          <button key={src} className="thumb" onClick={() => setOpen({ src, c })}>
            <img src={src} alt={`${c} yield field`} loading="lazy" />
            <span style={{ background: BANDS[c].color }}>{BANDS[c].label}</span>
          </button>
        ))}
      </div>
      {open && (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <img src={open.src} alt="" />
          <p>{open.src.split('/').pop()} · {BANDS[open.c].label} yield ({BANDS[open.c].range})</p>
        </div>
      )}
    </section>
  )
}
