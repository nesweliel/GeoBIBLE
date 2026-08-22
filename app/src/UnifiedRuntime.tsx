import { useMemo, useState } from 'react'
import { App } from './App'
import { periods } from './data/atlasData'
import { actorPeriodStates, canonicalActorName, statesForPeriod } from './data/canonicalStates'
import './canonical.css'

export function UnifiedRuntime() {
  const [open, setOpen] = useState(false)
  const [periodId, setPeriodId] = useState(periods[periods.length - 1]?.id ?? 'P08')
  const states = useMemo(() => statesForPeriod(periodId), [periodId])
  const period = periods.find(item => item.id === periodId)

  return (
    <>
      <App />
      <button
        className="canonical-badge"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="פתח רשם נתונים קנוני"
      >
        DATA FREEZE · {actorPeriodStates.length}
      </button>

      {open && (
        <div className="canonical-backdrop" onClick={() => setOpen(false)}>
          <aside className="canonical-drawer" dir="rtl" onClick={event => event.stopPropagation()}>
            <button className="canonical-close" type="button" onClick={() => setOpen(false)} aria-label="סגור">×</button>
            <div className="canonical-kicker">CANONICAL TEMPORAL REGISTER · DATA FREEZE V1</div>
            <h2>רשם המצבים הקנוני</h2>
            <p className="canonical-intro">
              מקור האמת של GeoBIBLE למצב הפוליטי־צבאי לאורך ציר הזמן. הרשומות נפרדות מגאומטריית ה־GIS,
              שהיא רקונסטרוקציה אנליטית ולא גבול קדסטרלי.
            </p>

            <div className="canonical-summary">
              <div><span>מצבי זמן</span><strong>{actorPeriodStates.length}</strong></div>
              <div><span>תקופות אב</span><strong>{periods.length}</strong></div>
              <div><span>בתקופה הנבחרת</span><strong>{states.length}</strong></div>
            </div>

            <label className="canonical-period-picker">
              <span>תקופה</span>
              <select value={periodId} onChange={event => setPeriodId(event.target.value)}>
                {periods.map(item => <option key={item.id} value={item.id}>{item.id} · {item.label}</option>)}
              </select>
            </label>

            <div className="canonical-period-title">
              <strong>{period?.label ?? periodId}</strong>
              <span>{period?.dateLabel}</span>
            </div>

            <div className="canonical-state-list">
              {states.map((state, index) => (
                <article key={`${state.period}-${state.actor_id}-${index}`}>
                  <header>
                    <strong>{canonicalActorName(state.actor_id)}</strong>
                    <span>{state.certainty}</span>
                  </header>
                  <div className="canonical-status">{state.status}</div>
                  <dl>
                    <div><dt>גרעין שליטה</dt><dd>{state.core_control || '—'}</dd></div>
                    <div><dt>השפעה</dt><dd>{state.influence || '—'}</dd></div>
                    <div><dt>מחלוקת</dt><dd>{state.contested || '—'}</dd></div>
                    <div><dt>אינטרס</dt><dd>{state.interest || '—'}</dd></div>
                  </dl>
                  {state.notes && <p>{state.notes}</p>}
                </article>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
