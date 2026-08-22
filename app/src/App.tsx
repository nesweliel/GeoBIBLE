import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson'
import { actorById, actors, locationById, locations, periods, routes } from './data/atlasData'
import type { HistoricalPeriod, Scale } from './types'

type AtlasFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties>
type Selection = { title: string; subtitle: string; body: string; confidence: string }

const SCALE_ORDER: Record<Scale, number> = { world: 0, levant: 1, local: 2 }

function periodLocations(period: HistoricalPeriod): AtlasFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: period.locationIds
      .map(id => locationById.get(id))
      .filter(Boolean)
      .map(site => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [site!.lon, site!.lat] },
        properties: {
          id: site!.id,
          name: site!.name,
          kind: site!.kind,
          confidence: site!.confidence,
          why: site!.why,
          scale: site!.scale,
        },
      })),
  }
}

function periodActors(period: HistoricalPeriod): AtlasFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: period.actorIds
      .map(id => actorById.get(id))
      .filter(actor => actor?.anchor)
      .map(actor => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: actor!.anchor! },
        properties: {
          id: actor!.id,
          name: actor!.name,
          category: actor!.category,
          interest: actor!.interest,
          status: actor!.status,
          confidence: actor!.confidence,
          scale: actor!.scale,
        },
      })),
  }
}

function periodRoutes(period: HistoricalPeriod): AtlasFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: routes
      .filter(route => route.periods.includes(period.id) && SCALE_ORDER[route.scale] <= SCALE_ORDER[period.scale])
      .map(route => ({
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: route.coordinates },
        properties: {
          id: route.id,
          name: route.name,
          confidence: route.confidence,
          scale: route.scale,
        },
      })),
  }
}

function stripModernContext(map: MapLibreMap) {
  const style = map.getStyle()
  for (const layer of style.layers ?? []) {
    const id = layer.id.toLowerCase()
    const shouldHide =
      layer.type === 'symbol' ||
      /road|motorway|highway|rail|transit|aeroway|airport|building|address|boundary/.test(id)
    if (!shouldHide) continue
    try {
      map.setLayoutProperty(layer.id, 'visibility', 'none')
    } catch {
      // Base styles vary; unsupported layers are safe to ignore.
    }
  }
}

function addHistoricalLayers(map: MapLibreMap) {
  map.addSource('historical-routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({
    id: 'historical-routes-line',
    type: 'line',
    source: 'historical-routes',
    paint: {
      'line-color': ['match', ['get', 'confidence'], 'high', '#b89157', 'medium', '#a27f50', '#806b51'],
      'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.1, 6, 2.2, 10, 4],
      'line-opacity': 0.72,
      'line-dasharray': [2, 2],
    },
  })

  map.addSource('historical-actors', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({
    id: 'historical-actors-halo',
    type: 'circle',
    source: 'historical-actors',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 6, 12, 10, 16],
      'circle-color': '#c7a86b',
      'circle-opacity': 0.15,
      'circle-stroke-color': '#c7a86b',
      'circle-stroke-width': 1,
      'circle-stroke-opacity': 0.5,
    },
  })
  map.addLayer({
    id: 'historical-actors-core',
    type: 'circle',
    source: 'historical-actors',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 3.5, 6, 5.5, 10, 7],
      'circle-color': '#1d1813',
      'circle-stroke-color': '#d7bd82',
      'circle-stroke-width': 1.5,
    },
  })
  map.addLayer({
    id: 'historical-actors-label',
    type: 'symbol',
    source: 'historical-actors',
    minzoom: 2,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 2, 11, 6, 13, 10, 15],
      'text-offset': [0, 1.1],
      'text-anchor': 'top',
      'text-allow-overlap': false,
      'text-ignore-placement': false,
    },
    paint: {
      'text-color': '#f1e3c2',
      'text-halo-color': '#17130f',
      'text-halo-width': 1.3,
      'text-halo-blur': 0.5,
    },
  })

  map.addSource('historical-sites', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({
    id: 'historical-sites-core',
    type: 'circle',
    source: 'historical-sites',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 3, 7, 5, 11, 7],
      'circle-color': ['match', ['get', 'confidence'], 'high', '#e4d1a6', 'medium', '#c5a873', '#8f7d61'],
      'circle-stroke-color': '#272019',
      'circle-stroke-width': 1.5,
    },
  })
  map.addLayer({
    id: 'historical-sites-label',
    type: 'symbol',
    source: 'historical-sites',
    minzoom: 4.2,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 8, 13, 12, 15],
      'text-offset': [0.8, 0],
      'text-anchor': 'left',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#f6ecd6',
      'text-halo-color': '#19140f',
      'text-halo-width': 1.4,
    },
  })
}

function setLayerVisibility(map: MapLibreMap, layerIds: string[], visible: boolean) {
  for (const id of layerIds) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
  }
}

export function App() {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [periodIndex, setPeriodIndex] = useState(periods.length - 1)
  const [mode, setMode] = useState<'story' | 'explore'>('story')
  const [storyBeat, setStoryBeat] = useState(0)
  const [panelOpen, setPanelOpen] = useState(true)
  const [layersOpen, setLayersOpen] = useState(false)
  const [actorsVisible, setActorsVisible] = useState(true)
  const [sitesVisible, setSitesVisible] = useState(true)
  const [routesVisible, setRoutesVisible] = useState(true)
  const [selected, setSelected] = useState<Selection | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const period = periods[periodIndex]
  const chapterKey = period.chapter.split(' · ')[0]
  const chapterPeriods = useMemo(
    () => periods.filter(item => item.chapter.split(' · ')[0] === chapterKey),
    [chapterKey],
  )
  const actorList = useMemo(
    () => period.actorIds.map(id => actorById.get(id)).filter((actor): actor is NonNullable<typeof actor> => Boolean(actor)),
    [period],
  )

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/3d',
      center: [43, 29],
      zoom: 2.05,
      pitch: 0,
      bearing: 0,
      minZoom: 1.6,
      maxZoom: 14,
      maxBounds: [[5, 8], [92, 48]],
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-left')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 120 }), 'bottom-right')

    map.on('load', () => {
      stripModernContext(map)
      addHistoricalLayers(map)

      const selectFeature = (layerId: string, kind: 'actor' | 'site') => {
        map.on('click', layerId, event => {
          const props = event.features?.[0]?.properties
          if (!props) return
          setSelected(kind === 'site' ? {
            title: String(props.name ?? ''),
            subtitle: String(props.kind ?? ''),
            body: String(props.why ?? ''),
            confidence: String(props.confidence ?? 'medium'),
          } : {
            title: String(props.name ?? ''),
            subtitle: String(props.category ?? ''),
            body: `${String(props.status ?? '')}\n\nאינטרס: ${String(props.interest ?? '')}`,
            confidence: String(props.confidence ?? 'medium'),
          })
        })
        map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = '' })
      }

      selectFeature('historical-sites-core', 'site')
      selectFeature('historical-actors-core', 'actor')
      setMapReady(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    ;(map.getSource('historical-sites') as GeoJSONSource | undefined)?.setData(periodLocations(period))
    ;(map.getSource('historical-actors') as GeoJSONSource | undefined)?.setData(periodActors(period))
    ;(map.getSource('historical-routes') as GeoJSONSource | undefined)?.setData(periodRoutes(period))

    setLayerVisibility(map, ['historical-sites-core', 'historical-sites-label'], sitesVisible)
    setLayerVisibility(map, ['historical-actors-core', 'historical-actors-halo', 'historical-actors-label'], actorsVisible)
    setLayerVisibility(map, ['historical-routes-line'], routesVisible)

    map.easeTo({
      center: period.camera.center,
      zoom: period.camera.zoom,
      pitch: period.camera.pitch ?? 0,
      bearing: period.camera.bearing ?? 0,
      duration: mode === 'story' ? 1200 : 650,
      essential: true,
    })
    setStoryBeat(0)
    setSelected(null)
  }, [period, mapReady, actorsVisible, sitesVisible, routesVisible, mode])

  const choosePeriod = (id: string) => {
    const index = periods.findIndex(item => item.id === id)
    if (index >= 0) setPeriodIndex(index)
  }

  const jumpScale = (scale: Scale) => {
    const map = mapRef.current
    if (!map) return
    const target = scale === 'world'
      ? { center: [43, 29] as [number, number], zoom: 2.05, pitch: 0 }
      : scale === 'levant'
        ? { center: [35.5, 32] as [number, number], zoom: 5.5, pitch: 12 }
        : { center: [35.25, 32] as [number, number], zoom: 8.2, pitch: 28 }
    map.easeTo({ ...target, duration: 900, essential: true })
  }

  const nextBeat = () => {
    const next = storyBeat + 1
    if (next < period.beats.length) {
      setStoryBeat(next)
      const beat = period.beats[next]
      if (beat.camera && mapRef.current) {
        mapRef.current.easeTo({ ...beat.camera, duration: 1100, essential: true })
      }
      return
    }
    if (periodIndex < periods.length - 1) setPeriodIndex(current => current + 1)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">G</div>
          <div>
            <div className="eyebrow">ARCHIVUM HISTORIAE</div>
            <h1>GeoBIBLE</h1>
          </div>
        </div>
        <div className="topbar-center">
          <span className="chapter-chip">{period.chapter}</span>
          <strong>{period.label}</strong>
          <span>{period.dateLabel}</span>
        </div>
        <div className="mode-switch" role="group" aria-label="מצב שימוש">
          <button className={mode === 'story' ? 'active' : ''} onClick={() => setMode('story')}>סיפור מודרך</button>
          <button className={mode === 'explore' ? 'active' : ''} onClick={() => setMode('explore')}>חקירה חופשית</button>
        </div>
      </header>

      <section className="timeline-shell" aria-label="ציר הזמן">
        <div className="timeline-track">
          {periods.map((item, index) => (
            <button key={item.id} className={`timeline-node ${index === periodIndex ? 'active' : ''}`} onClick={() => setPeriodIndex(index)}>
              <span className="node-index">{String(index + 1).padStart(2, '0')}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        {chapterPeriods.length > 1 && (
          <div className="subtimeline">
            <span>בתוך הפרק:</span>
            {chapterPeriods.map(item => (
              <button key={item.id} className={item.id === period.id ? 'active' : ''} onClick={() => choosePeriod(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="workspace">
        <div className="map-wrap">
          <div ref={mapContainer} className="map" aria-label="מפה היסטורית אינטראקטיבית" />

          <div className="map-scale-switch">
            <button onClick={() => jumpScale('world')}>עולם</button>
            <button onClick={() => jumpScale('levant')}>לבנט</button>
            <button onClick={() => jumpScale('local')}>מקומי</button>
          </div>

          <div className="map-caption">
            <span>VECTOR BASEMAP</span>
            <strong>ללא גבולות מודרניים · מידע היסטורי לפי State</strong>
          </div>

          <button className="layers-toggle" onClick={() => setLayersOpen(open => !open)} aria-expanded={layersOpen}>שכבות</button>
          {layersOpen && (
            <div className="layers-panel">
              <label><input type="checkbox" checked={actorsVisible} onChange={event => setActorsVisible(event.target.checked)} /> שחקנים ומעצמות</label>
              <label><input type="checkbox" checked={sitesVisible} onChange={event => setSitesVisible(event.target.checked)} /> ערים ואתרים</label>
              <label><input type="checkbox" checked={routesVisible} onChange={event => setRoutesVisible(event.target.checked)} /> צירים ורשתות</label>
              <div className="confidence-key"><i className="high" />גבוהה <i className="medium" />בינונית <i className="low" />נמוכה</div>
            </div>
          )}

          {selected && (
            <article className="selection-card">
              <button className="close-card" onClick={() => setSelected(null)} aria-label="סגור">×</button>
              <div className="eyebrow">SELECTED RECORD</div>
              <h3>{selected.title}</h3>
              <div className="selection-subtitle">{selected.subtitle}</div>
              <p>{selected.body}</p>
              <div className={`confidence confidence-${selected.confidence}`}>ודאות: {selected.confidence}</div>
            </article>
          )}
        </div>

        <aside className={`story-panel ${panelOpen ? 'open' : 'closed'}`}>
          <button className="panel-collapse" onClick={() => setPanelOpen(open => !open)}>{panelOpen ? '◀' : '▶'}</button>
          {panelOpen && (
            <>
              <div className="archive-label">TABLET {String(periodIndex + 1).padStart(2, '0')}</div>
              <h2>{period.label}</h2>
              <p className="subtitle">{period.subtitle}</p>
              <blockquote>{period.thesis}</blockquote>

              {mode === 'story' ? (
                <div className="story-beat">
                  <div className="beat-counter">{storyBeat + 1} / {period.beats.length}</div>
                  <span>{period.beats[storyBeat].label}</span>
                  <p>{period.beats[storyBeat].text}</p>
                  <button className="primary-action" onClick={nextBeat}>
                    {storyBeat < period.beats.length - 1 ? 'המשך בסיפור' : periodIndex < periods.length - 1 ? 'לתקופה הבאה' : 'סוף הציר'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="section-title">שחקנים בתקופה</div>
                  <div className="actor-list">
                    {actorList.map(actor => (
                      <button key={actor.id} onClick={() => setSelected({
                        title: actor.name,
                        subtitle: actor.category,
                        body: `${actor.status}\n\nאינטרס: ${actor.interest}`,
                        confidence: actor.confidence,
                      })}>
                        <strong>{actor.name}</strong>
                        <span>{actor.category}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="section-title">מה השתנה</div>
              <ol className="changes-list">
                {period.changes.map(change => <li key={change}>{change}</li>)}
              </ol>

              <div className="map-rule">
                <span>כלל מפה</span>
                <p>{period.mapNote}</p>
              </div>
            </>
          )}
        </aside>
      </section>

      <footer className="footerbar">
        <span>GeoBIBLE Alpha 0.1</span>
        <span>{actors.length} actors · {locations.length} geocoded records · {periods.length} timeline states</span>
        <span>OpenFreeMap © OpenMapTiles · Data from OpenStreetMap</span>
      </footer>
    </main>
  )
}
