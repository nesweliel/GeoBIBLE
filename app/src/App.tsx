import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry, Polygon } from 'geojson'
import { actorById, actors, locationById, locations, periods, routes } from './data/atlasData'
import type { HistoricalActor, HistoricalPeriod, Scale } from './types'

type AtlasFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties>
type Selection = { title: string; subtitle: string; body: string; confidence: string }
type SearchResult = { id: string; name: string; subtitle: string; coordinates: [number, number]; kind: 'actor' | 'site'; confidence: string; body: string }
type ZoneSpec = { actorId: string; rx?: number; ry?: number; type?: string; label?: string; color?: string }

const SCALE_ORDER: Record<Scale, number> = { world: 0, levant: 1, local: 2 }
const EMPTY: AtlasFeatureCollection = { type: 'FeatureCollection', features: [] }

const ACTOR_COLORS: Record<string, string> = {
  judah: '#5d7892', benjamin: '#6f8c70', ephraim: '#769276', manasseh: '#667f69', gad: '#647c68',
  philistines: '#9a5f55', jebusites: '#817b72', moab: '#aa7e4e', ammon: '#b38a53', amalek: '#8b6956',
  hazor: '#9b765a', dan: '#7a8064', midian: '#8b6e58', 'east-people': '#8b6e58', kenites: '#837765',
  'israel-tribal': '#6e876f', 'canaanite-cities': '#9b795d', gibeonites: '#7d866a',
}

const ZONES: Record<string, ZoneSpec[]> = {
  P01: [
    { actorId: 'israel-tribal', rx: .42, ry: .34, type: 'influence', label: 'התבססות ישראלית' },
    { actorId: 'canaanite-cities', rx: .72, ry: .55, type: 'influence', label: 'מערכת ערי־המדינה' },
    { actorId: 'gibeonites', rx: .13, ry: .09, type: 'core', label: 'ברית גבעון' },
    { actorId: 'jebusites', rx: .06, ry: .045, type: 'independent', label: 'יבוס העצמאית' },
  ],
  P02: [
    { actorId: 'judah', rx: .34, ry: .38 }, { actorId: 'benjamin', rx: .15, ry: .13 },
    { actorId: 'ephraim', rx: .27, ry: .22 }, { actorId: 'manasseh', rx: .43, ry: .28 },
    { actorId: 'issachar', rx: .28, ry: .17 }, { actorId: 'zebulun', rx: .22, ry: .16 },
    { actorId: 'naphtali', rx: .25, ry: .28 }, { actorId: 'asher', rx: .19, ry: .35 },
    { actorId: 'dan', rx: .18, ry: .16 }, { actorId: 'simeon', rx: .32, ry: .25 },
    { actorId: 'gad', rx: .25, ry: .34 }, { actorId: 'reuben', rx: .28, ry: .30 },
  ],
  P03A: [
    { actorId: 'benjamin', rx: .18, ry: .16, type: 'core' },
    { actorId: 'moab', rx: .42, ry: .36, type: 'influence' },
    { actorId: 'ammon', rx: .35, ry: .30, type: 'influence' },
    { actorId: 'amalek', rx: .55, ry: .30, type: 'corridor' },
  ],
  P03B: [
    { actorId: 'naphtali', rx: .28, ry: .28, type: 'core' },
    { actorId: 'zebulun', rx: .25, ry: .18, type: 'core' },
    { actorId: 'hazor', rx: .48, ry: .28, type: 'influence', label: 'מערכת חצור' },
  ],
  P03C: [
    { actorId: 'manasseh', rx: .42, ry: .28, type: 'core' },
    { actorId: 'midian', rx: .85, ry: .42, type: 'corridor' },
    { actorId: 'amalek', rx: .62, ry: .30, type: 'corridor' },
    { actorId: 'east-people', rx: .85, ry: .42, type: 'corridor' },
  ],
  P03D: [
    { actorId: 'gad', rx: .32, ry: .38, type: 'core', label: 'הגלעד' },
    { actorId: 'manasseh', rx: .33, ry: .36, type: 'core', label: 'הגלעד' },
    { actorId: 'ephraim', rx: .28, ry: .23, type: 'contested' },
    { actorId: 'ammon', rx: .42, ry: .35, type: 'influence' },
  ],
  P03E: [
    { actorId: 'dan', rx: .22, ry: .18, type: 'contested' },
    { actorId: 'philistines', rx: .48, ry: .42, type: 'influence' },
  ],
  P03F: [
    { actorId: 'dan', rx: .20, ry: .16, type: 'migration', label: 'מוצא דן במערב' },
  ],
  P04: [{ actorId: 'philistines', rx: .55, ry: .48, type: 'core', label: 'המערכת הפלישתית' }],
  P05: [
    { actorId: 'israel-tribal', rx: .55, ry: .58, type: 'influence' },
    { actorId: 'philistines', rx: .55, ry: .47, type: 'core' },
    { actorId: 'benjamin', rx: .19, ry: .18, type: 'core' },
  ],
  P06A: [
    { actorId: 'benjamin', rx: .20, ry: .19, type: 'core' },
    { actorId: 'gad', rx: .31, ry: .37, type: 'core', label: 'עומק גלעדי' },
    { actorId: 'manasseh', rx: .35, ry: .35, type: 'core', label: 'עומק גלעדי' },
    { actorId: 'ammon', rx: .45, ry: .36, type: 'influence' },
  ],
  P06B: [
    { actorId: 'benjamin', rx: .18, ry: .17, type: 'core' },
    { actorId: 'philistines', rx: .47, ry: .42, type: 'influence' },
  ],
  P06C: [
    { actorId: 'judah', rx: .36, ry: .40, type: 'core' },
    { actorId: 'simeon', rx: .36, ry: .28, type: 'core' },
    { actorId: 'amalek', rx: .72, ry: .38, type: 'corridor' },
    { actorId: 'kenites', rx: .28, ry: .22, type: 'influence' },
  ],
  P06D: [
    { actorId: 'judah', rx: .37, ry: .42, type: 'influence', label: 'קשרים דרומיים של דוד' },
    { actorId: 'philistines', rx: .50, ry: .44, type: 'core' },
    { actorId: 'amalek', rx: .68, ry: .34, type: 'corridor' },
  ],
  P07: [
    { actorId: 'philistines', rx: .72, ry: .48, type: 'military', label: 'יוזמה פלישתית / נוכחות' },
    { actorId: 'benjamin', rx: .20, ry: .20, type: 'unclear' },
    { actorId: 'manasseh', rx: .43, ry: .29, type: 'unclear' },
    { actorId: 'issachar', rx: .29, ry: .18, type: 'contested' },
    { actorId: 'gad', rx: .30, ry: .36, type: 'core', label: 'עומק נאמן לבית שאול' },
  ],
  P08: [
    { actorId: 'judah', rx: .37, ry: .43, type: 'core', label: 'ממלכת דוד — גרעין שליטה' },
    { actorId: 'benjamin', rx: .21, ry: .20, type: 'influence', label: 'בית שאול — השפעה' },
    { actorId: 'ephraim', rx: .32, ry: .25, type: 'influence', label: 'בית שאול — השפעה' },
    { actorId: 'manasseh', rx: .48, ry: .31, type: 'influence', label: 'בית שאול — השפעה' },
    { actorId: 'gad', rx: .32, ry: .38, type: 'influence', label: 'עומק בית שאול / גלעד' },
    { actorId: 'jebusites', rx: .065, ry: .05, type: 'independent', label: 'ירושלים / יבוס — עצמאית' },
    { actorId: 'philistines', rx: .60, ry: .46, type: 'military', label: 'פלשתים — כוח חיצוני פעיל' },
  ],
}

const PERIOD_SOURCES: Record<string, { title: string; note: string; url: string }[]> = {
  P01: [
    { title: 'Joshua 9', note: 'ברית גבעון', url: 'https://www.biblegateway.com/passage/?search=Joshua%209&version=NIV' },
    { title: 'Joshua 10', note: 'מערכת הדרום', url: 'https://www.biblegateway.com/passage/?search=Joshua%2010&version=NIV' },
  ],
  P02: [{ title: 'Joshua 13–19', note: 'נחלות שבטי ישראל', url: 'https://www.biblegateway.com/passage/?search=Joshua%2013-19&version=NIV' }],
  P03A: [{ title: 'Judges 3:12–30', note: 'אהוד, מואב, עמון ועמלק', url: 'https://www.biblegateway.com/passage/?search=Judges%203%3A12-30&version=NIV' }],
  P03B: [{ title: 'Judges 4–5', note: 'דבורה, ברק וחצור', url: 'https://www.biblegateway.com/passage/?search=Judges%204-5&version=NIV' }],
  P03C: [{ title: 'Judges 6–8', note: 'גדעון והפשיטות ממזרח', url: 'https://www.biblegateway.com/passage/?search=Judges%206-8&version=NIV' }],
  P03D: [{ title: 'Judges 10–12', note: 'יפתח, עמון, גלעד ואפרים', url: 'https://www.biblegateway.com/passage/?search=Judges%2010-12&version=NIV' }],
  P03E: [{ title: 'Judges 13–16', note: 'שמשון והחזית הפלישתית', url: 'https://www.biblegateway.com/passage/?search=Judges%2013-16&version=NIV' }],
  P03F: [{ title: 'Judges 18', note: 'נדידת דן', url: 'https://www.biblegateway.com/passage/?search=Judges%2018&version=NIV' }],
  P04: [{ title: 'The Met — Eastern Mediterranean', note: 'הקשר האזורי של ראשית תקופת הברזל', url: 'https://www.metmuseum.org/toah/ht/04/wae.html' }],
  P05: [{ title: '1 Samuel 7–10', note: 'שמואל והמעבר למלוכה', url: 'https://www.biblegateway.com/passage/?search=1%20Samuel%207-10&version=NIV' }],
  P06A: [{ title: '1 Samuel 11', note: 'שאול ויבש גלעד', url: 'https://www.biblegateway.com/passage/?search=1%20Samuel%2011&version=NIV' }],
  P06B: [{ title: '1 Samuel 13–14', note: 'מכמש והמעברים', url: 'https://www.biblegateway.com/passage/?search=1%20Samuel%2013-14&version=NIV' }],
  P06C: [{ title: '1 Samuel 15', note: 'המערכה בעמלק', url: 'https://www.biblegateway.com/passage/?search=1%20Samuel%2015&version=NIV' }],
  P06D: [{ title: '1 Samuel 27', note: 'דוד תחת אכיש', url: 'https://www.biblegateway.com/passage/?search=1%20Samuel%2027&version=NIV' }],
  P07: [{ title: '1 Samuel 31', note: 'גלבוע, בית שאן ויבש גלעד', url: 'https://www.biblegateway.com/passage/?search=1%20Samuel%2031&version=NIV' }],
  P08: [{ title: '2 Samuel 2', note: 'חברון, מחניים ובית שאול', url: 'https://www.biblegateway.com/passage/?search=2%20Samuel%202&version=NIV' }],
}

const JUDGES_REGISTER = [
  'עתניאל', 'אהוד', 'שמגר', 'דבורה וברק', 'גדעון', 'אבימלך', 'תולע', 'יאיר',
  'יפתח', 'אבצן', 'אילון', 'עבדון', 'שמשון', 'מיכה ונדידת דן', 'מלחמת בנימין',
]

function periodLocations(period: HistoricalPeriod): AtlasFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: period.locationIds.flatMap(id => {
      const site = locationById.get(id)
      return site ? [{
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [site.lon, site.lat] },
        properties: { id: site.id, name: site.name, kind: site.kind, confidence: site.confidence, why: site.why, scale: site.scale },
      }] : []
    }),
  }
}

function periodActors(period: HistoricalPeriod): AtlasFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: period.actorIds.flatMap(id => {
      const actor = actorById.get(id)
      return actor?.anchor ? [{
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: actor.anchor },
        properties: { id: actor.id, name: actor.name, category: actor.category, interest: actor.interest, status: actor.status, confidence: actor.confidence, scale: actor.scale },
      }] : []
    }),
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
        properties: { id: route.id, name: route.name, confidence: route.confidence, scale: route.scale },
      })),
  }
}

function ellipse(center: [number, number], rx: number, ry: number, props: GeoJsonProperties): Feature<Polygon, GeoJsonProperties> {
  const coordinates: [number, number][] = []
  for (let i = 0; i <= 48; i += 1) {
    const angle = (Math.PI * 2 * i) / 48
    coordinates.push([center[0] + Math.cos(angle) * rx, center[1] + Math.sin(angle) * ry])
  }
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coordinates] }, properties: props }
}

function periodZones(period: HistoricalPeriod): AtlasFeatureCollection {
  const specs = ZONES[period.id] ?? []
  return {
    type: 'FeatureCollection',
    features: specs.flatMap(spec => {
      const actor = actorById.get(spec.actorId)
      if (!actor?.anchor) return []
      const type = spec.type ?? 'reconstruction'
      return [ellipse(actor.anchor, spec.rx ?? .24, spec.ry ?? .20, {
        id: `${period.id}-${actor.id}-${type}`,
        actorId: actor.id,
        name: spec.label ?? actor.name,
        actorName: actor.name,
        type,
        confidence: actor.confidence,
        color: spec.color ?? ACTOR_COLORS[actor.id] ?? '#89765d',
        status: actor.status,
        interest: actor.interest,
      })]
    }),
  }
}

function stripModernContext(map: MapLibreMap) {
  const style = map.getStyle()
  for (const layer of style.layers ?? []) {
    const id = layer.id.toLowerCase()
    const shouldHide = layer.type === 'symbol' || /road|motorway|highway|rail|transit|aeroway|airport|building|address|boundary/.test(id)
    if (!shouldHide) continue
    try { map.setLayoutProperty(layer.id, 'visibility', 'none') } catch { /* style-dependent */ }
  }
}

function addHistoricalLayers(map: MapLibreMap) {
  map.addSource('historical-zones', { type: 'geojson', data: EMPTY })
  map.addLayer({
    id: 'historical-zones-fill', type: 'fill', source: 'historical-zones',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': ['match', ['get', 'type'], 'core', .30, 'independent', .36, 'military', .20, 'contested', .13, 'corridor', .09, 'migration', .10, 'unclear', .08, .16],
    },
  })
  map.addLayer({
    id: 'historical-zones-line', type: 'line', source: 'historical-zones',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1, 8, 2.2, 11, 3],
      'line-opacity': .88,
      'line-dasharray': ['match', ['get', 'type'], 'core', ['literal', [1, 0]], 'independent', ['literal', [1, 0]], ['literal', [3, 2]]],
    },
  })

  map.addSource('compare-zones', { type: 'geojson', data: EMPTY })
  map.addLayer({
    id: 'compare-zones-line', type: 'line', source: 'compare-zones',
    paint: { 'line-color': '#efe0bf', 'line-width': 1.4, 'line-opacity': .52, 'line-dasharray': [2, 2] },
  })

  map.addSource('historical-routes', { type: 'geojson', data: EMPTY })
  map.addLayer({
    id: 'historical-routes-line', type: 'line', source: 'historical-routes',
    paint: {
      'line-color': ['match', ['get', 'confidence'], 'high', '#b89157', 'medium', '#a27f50', '#806b51'],
      'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.1, 6, 2.2, 10, 4], 'line-opacity': .72, 'line-dasharray': [2, 2],
    },
  })

  map.addSource('historical-actors', { type: 'geojson', data: EMPTY })
  map.addLayer({
    id: 'historical-actors-halo', type: 'circle', source: 'historical-actors',
    paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 8, 6, 12, 10, 16], 'circle-color': '#c7a86b', 'circle-opacity': .13, 'circle-stroke-color': '#c7a86b', 'circle-stroke-width': 1, 'circle-stroke-opacity': .45 },
  })
  map.addLayer({
    id: 'historical-actors-core', type: 'circle', source: 'historical-actors',
    paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 3.5, 6, 5.5, 10, 7], 'circle-color': '#1d1813', 'circle-stroke-color': '#d7bd82', 'circle-stroke-width': 1.5 },
  })
  map.addLayer({
    id: 'historical-actors-label', type: 'symbol', source: 'historical-actors', minzoom: 2,
    layout: { 'text-field': ['get', 'name'], 'text-size': ['interpolate', ['linear'], ['zoom'], 2, 11, 6, 13, 10, 15], 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-allow-overlap': false },
    paint: { 'text-color': '#f1e3c2', 'text-halo-color': '#17130f', 'text-halo-width': 1.3, 'text-halo-blur': .5 },
  })

  map.addSource('historical-sites', { type: 'geojson', data: EMPTY })
  map.addLayer({
    id: 'historical-sites-core', type: 'circle', source: 'historical-sites',
    paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 3, 7, 5, 11, 7], 'circle-color': ['match', ['get', 'confidence'], 'high', '#e4d1a6', 'medium', '#c5a873', '#8f7d61'], 'circle-stroke-color': '#272019', 'circle-stroke-width': 1.5 },
  })
  map.addLayer({
    id: 'historical-sites-label', type: 'symbol', source: 'historical-sites', minzoom: 4.2,
    layout: { 'text-field': ['get', 'name'], 'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 8, 13, 12, 15], 'text-offset': [.8, 0], 'text-anchor': 'left', 'text-allow-overlap': false },
    paint: { 'text-color': '#f6ecd6', 'text-halo-color': '#19140f', 'text-halo-width': 1.4 },
  })
}

function setLayerVisibility(map: MapLibreMap, layerIds: string[], visible: boolean) {
  for (const id of layerIds) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
}

function selectActor(actor: HistoricalActor): Selection {
  return { title: actor.name, subtitle: actor.category, body: `${actor.status}\n\nאינטרס: ${actor.interest}`, confidence: actor.confidence }
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
  const [zonesVisible, setZonesVisible] = useState(true)
  const [selected, setSelected] = useState<Selection | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareIndex, setCompareIndex] = useState(Math.max(0, periods.length - 2))
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [judgesOpen, setJudgesOpen] = useState(false)

  const period = periods[periodIndex]
  const comparePeriod = periods[compareIndex]
  const chapterKey = period.chapter.split(' · ')[0]
  const chapterPeriods = useMemo(() => periods.filter(item => item.chapter.split(' · ')[0] === chapterKey), [chapterKey])
  const actorList = useMemo(() => period.actorIds.map(id => actorById.get(id)).filter((actor): actor is HistoricalActor => Boolean(actor)), [period])

  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q.length < 2) return []
    const actorResults: SearchResult[] = actors.filter(actor => actor.anchor && `${actor.name} ${actor.category}`.toLowerCase().includes(q)).slice(0, 6).map(actor => ({
      id: actor.id, name: actor.name, subtitle: actor.category, coordinates: actor.anchor!, kind: 'actor', confidence: actor.confidence, body: `${actor.status}\n\nאינטרס: ${actor.interest}`,
    }))
    const siteResults: SearchResult[] = locations.filter(site => `${site.name} ${site.kind}`.toLowerCase().includes(q)).slice(0, 6).map(site => ({
      id: site.id, name: site.name, subtitle: site.kind, coordinates: [site.lon, site.lat], kind: 'site', confidence: site.confidence, body: site.why,
    }))
    return [...siteResults, ...actorResults].slice(0, 10)
  }, [searchQuery])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: mapContainer.current, style: 'https://tiles.openfreemap.org/styles/3d', center: [43, 29], zoom: 2.05,
      pitch: 0, bearing: 0, minZoom: 1.6, maxZoom: 14, maxBounds: [[5, 8], [92, 48]],
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-left')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 120 }), 'bottom-right')

    map.on('load', () => {
      stripModernContext(map)
      addHistoricalLayers(map)

      const wire = (layerId: string, handler: (props: GeoJsonProperties) => Selection) => {
        map.on('click', layerId, event => {
          const props = event.features?.[0]?.properties
          if (props) setSelected(handler(props))
        })
        map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = '' })
      }
      wire('historical-sites-core', props => ({ title: String(props.name ?? ''), subtitle: String(props.kind ?? ''), body: String(props.why ?? ''), confidence: String(props.confidence ?? 'medium') }))
      wire('historical-actors-core', props => ({ title: String(props.name ?? ''), subtitle: String(props.category ?? ''), body: `${String(props.status ?? '')}\n\nאינטרס: ${String(props.interest ?? '')}`, confidence: String(props.confidence ?? 'medium') }))
      wire('historical-zones-fill', props => ({ title: String(props.name ?? ''), subtitle: `שכבת ${String(props.type ?? 'reconstruction')}`, body: `${String(props.status ?? '')}\n\nאינטרס: ${String(props.interest ?? '')}\n\nהגאומטריה היא רקונסטרוקציה אנליטית ולא גבול קדסטרלי.`, confidence: String(props.confidence ?? 'medium') }))
      setMapReady(true)
    })

    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return
    ;(map.getSource('historical-sites') as GeoJSONSource | undefined)?.setData(periodLocations(period))
    ;(map.getSource('historical-actors') as GeoJSONSource | undefined)?.setData(periodActors(period))
    ;(map.getSource('historical-routes') as GeoJSONSource | undefined)?.setData(periodRoutes(period))
    ;(map.getSource('historical-zones') as GeoJSONSource | undefined)?.setData(periodZones(period))
    ;(map.getSource('compare-zones') as GeoJSONSource | undefined)?.setData(compareOpen ? periodZones(comparePeriod) : EMPTY)

    setLayerVisibility(map, ['historical-sites-core', 'historical-sites-label'], sitesVisible)
    setLayerVisibility(map, ['historical-actors-core', 'historical-actors-halo', 'historical-actors-label'], actorsVisible)
    setLayerVisibility(map, ['historical-routes-line'], routesVisible)
    setLayerVisibility(map, ['historical-zones-fill', 'historical-zones-line'], zonesVisible)
    setLayerVisibility(map, ['compare-zones-line'], compareOpen)

    map.easeTo({ center: period.camera.center, zoom: period.camera.zoom, pitch: period.camera.pitch ?? 0, bearing: period.camera.bearing ?? 0, duration: mode === 'story' ? 1050 : 600, essential: true })
    setStoryBeat(0)
    setSelected(null)
  }, [period, comparePeriod, compareOpen, mapReady, actorsVisible, sitesVisible, routesVisible, zonesVisible, mode])

  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setInterval(() => {
      setPeriodIndex(current => current >= periods.length - 1 ? 0 : current + 1)
    }, 4200)
    return () => window.clearInterval(timer)
  }, [isPlaying])

  useEffect(() => {
    if (periodIndex > 0 && !compareOpen) setCompareIndex(periodIndex - 1)
  }, [periodIndex, compareOpen])

  const choosePeriod = (id: string) => {
    const index = periods.findIndex(item => item.id === id)
    if (index >= 0) setPeriodIndex(index)
  }

  const jumpScale = (scale: Scale) => {
    const map = mapRef.current
    if (!map) return
    const target = scale === 'world' ? { center: [43, 29] as [number, number], zoom: 2.05, pitch: 0 }
      : scale === 'levant' ? { center: [35.5, 32] as [number, number], zoom: 5.5, pitch: 12 }
        : { center: [35.25, 32] as [number, number], zoom: 8.2, pitch: 28 }
    map.easeTo({ ...target, duration: 850, essential: true })
  }

  const nextBeat = () => {
    const next = storyBeat + 1
    if (next < period.beats.length) {
      setStoryBeat(next)
      const beat = period.beats[next]
      if (beat.camera && mapRef.current) mapRef.current.easeTo({ ...beat.camera, duration: 1000, essential: true })
      return
    }
    if (periodIndex < periods.length - 1) setPeriodIndex(current => current + 1)
  }

  const chooseSearchResult = (result: SearchResult) => {
    setSelected({ title: result.name, subtitle: result.subtitle, body: result.body, confidence: result.confidence })
    setSearchOpen(false)
    mapRef.current?.easeTo({ center: result.coordinates, zoom: result.kind === 'site' ? 9.3 : 7.5, pitch: 26, duration: 800, essential: true })
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">G</div>
          <div><div className="eyebrow">ARCHIVUM HISTORIAE · V1</div><h1>GeoBIBLE</h1></div>
        </div>
        <div className="topbar-center">
          <span className="chapter-chip">{period.chapter}</span><strong>{period.label}</strong><span>{period.dateLabel}</span>
        </div>
        <div className="top-actions">
          <button className={`icon-action ${isPlaying ? 'active' : ''}`} onClick={() => setIsPlaying(value => !value)}>{isPlaying ? 'השהה' : '▶ נגן'}</button>
          <button className={`icon-action ${compareOpen ? 'active' : ''}`} onClick={() => setCompareOpen(value => !value)}>השווה</button>
          <button className="icon-action" onClick={() => setSourcesOpen(true)}>מקורות</button>
          <div className="mode-switch" role="group" aria-label="מצב שימוש">
            <button className={mode === 'story' ? 'active' : ''} onClick={() => setMode('story')}>סיפור</button>
            <button className={mode === 'explore' ? 'active' : ''} onClick={() => setMode('explore')}>חקירה</button>
          </div>
        </div>
      </header>

      <section className="timeline-shell" aria-label="ציר הזמן">
        <div className="timeline-track">
          {periods.map((item, index) => (
            <button key={item.id} className={`timeline-node ${index === periodIndex ? 'active' : ''}`} onClick={() => { setIsPlaying(false); setPeriodIndex(index) }}>
              <span className="node-index">{String(index + 1).padStart(2, '0')}</span><span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="timeline-secondary">
          {chapterPeriods.length > 1 ? <div className="subtimeline"><span>בתוך הפרק:</span>{chapterPeriods.map(item => <button key={item.id} className={item.id === period.id ? 'active' : ''} onClick={() => choosePeriod(item.id)}>{item.label}</button>)}</div> : <div />}
          {period.id.startsWith('P03') && <button className="judges-button" onClick={() => setJudgesOpen(value => !value)}>רשם השופטים · 15 אירועים</button>}
        </div>
      </section>

      <section className="workspace">
        <div className="map-wrap">
          <div ref={mapContainer} className="map" aria-label="מפה היסטורית אינטראקטיבית" />

          <div className="search-shell">
            <button className="search-toggle" onClick={() => setSearchOpen(value => !value)}>⌕ חיפוש</button>
            {searchOpen && <div className="search-panel">
              <input autoFocus value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="חפש עיר, שבט, ממלכה..." />
              <div className="search-results">
                {searchResults.length ? searchResults.map(result => <button key={`${result.kind}-${result.id}`} onClick={() => chooseSearchResult(result)}><strong>{result.name}</strong><span>{result.subtitle}</span></button>) : <p>הקלד לפחות שתי אותיות</p>}
              </div>
            </div>}
          </div>

          <div className="map-scale-switch"><button onClick={() => jumpScale('world')}>עולם</button><button onClick={() => jumpScale('levant')}>לבנט</button><button onClick={() => jumpScale('local')}>מקומי</button></div>

          <div className="map-caption"><span>HISTORICAL GIS · INTERPRETIVE BOUNDARIES</span><strong>גרעין שליטה · השפעה · מחלוקת · מובלעת · מסדרון</strong></div>

          <button className="layers-toggle" onClick={() => setLayersOpen(open => !open)} aria-expanded={layersOpen}>שכבות</button>
          {layersOpen && <div className="layers-panel">
            <label><input type="checkbox" checked={zonesVisible} onChange={event => setZonesVisible(event.target.checked)} /> אזורי שליטה והשפעה</label>
            <label><input type="checkbox" checked={actorsVisible} onChange={event => setActorsVisible(event.target.checked)} /> שחקנים ומעצמות</label>
            <label><input type="checkbox" checked={sitesVisible} onChange={event => setSitesVisible(event.target.checked)} /> ערים ואתרים</label>
            <label><input type="checkbox" checked={routesVisible} onChange={event => setRoutesVisible(event.target.checked)} /> צירים ורשתות</label>
            <div className="zone-key"><span><i className="z-core" />גרעין</span><span><i className="z-influence" />השפעה</span><span><i className="z-contested" />מחלוקת</span><span><i className="z-independent" />עצמאי</span></div>
            <div className="confidence-key"><i className="high" />גבוהה <i className="medium" />בינונית <i className="low" />נמוכה</div>
          </div>}

          {compareOpen && <div className="compare-card">
            <div><span>COMPARE</span><strong>{comparePeriod.label}</strong></div>
            <select value={compareIndex} onChange={event => setCompareIndex(Number(event.target.value))}>{periods.map((item, index) => <option key={item.id} value={index}>{item.label}</option>)}</select>
            <p>קו מקווקו בהיר = שכבות התקופה להשוואה. מילוי צבעוני = התקופה הנוכחית.</p>
          </div>}

          {judgesOpen && <div className="judges-register"><button onClick={() => setJudgesOpen(false)}>×</button><span>SECONDARY CHRONOLOGY</span><h3>רשם השופטים</h3><div>{JUDGES_REGISTER.map((name, index) => <i key={name}><b>{String(index + 1).padStart(2, '0')}</b>{name}</i>)}</div><p>חלק מהאירועים אינם יוצרים מפה טריטוריאלית חדשה; הם נשמרים ברשם הכרונולוגי כדי לא לאבד את הסיפור.</p></div>}

          {selected && <article className="selection-card">
            <button className="close-card" onClick={() => setSelected(null)} aria-label="סגור">×</button><div className="eyebrow">SELECTED RECORD</div><h3>{selected.title}</h3><div className="selection-subtitle">{selected.subtitle}</div><p>{selected.body}</p><div className={`confidence confidence-${selected.confidence}`}>ודאות: {selected.confidence}</div>
          </article>}
        </div>

        <aside className={`story-panel ${panelOpen ? 'open' : 'closed'}`}>
          <button className="panel-collapse" onClick={() => setPanelOpen(open => !open)}>{panelOpen ? '◀' : '▶'}</button>
          {panelOpen && <>
            <div className="archive-label">TABLET {String(periodIndex + 1).padStart(2, '0')} · {period.id}</div><h2>{period.label}</h2><p className="subtitle">{period.subtitle}</p><blockquote>{period.thesis}</blockquote>
            <div className="situation-grid"><div><span>קנה מידה</span><strong>{period.scale}</strong></div><div><span>שחקנים פעילים</span><strong>{actorList.length}</strong></div><div><span>מוקדים</span><strong>{period.locationIds.length}</strong></div><div><span>שכבות GIS</span><strong>{ZONES[period.id]?.length ?? 0}</strong></div></div>

            {mode === 'story' ? <div className="story-beat"><div className="beat-counter">{storyBeat + 1} / {period.beats.length}</div><span>{period.beats[storyBeat].label}</span><p>{period.beats[storyBeat].text}</p><button className="primary-action" onClick={nextBeat}>{storyBeat < period.beats.length - 1 ? 'המשך בסיפור' : periodIndex < periods.length - 1 ? 'לתקופה הבאה' : 'סוף הציר'}</button></div>
              : <><div className="section-title">שחקנים בתקופה</div><div className="actor-list">{actorList.map(actor => <button key={actor.id} onClick={() => setSelected(selectActor(actor))}><strong>{actor.name}</strong><span>{actor.category}</span><em>{actor.status}</em></button>)}</div></>}

            <div className="section-title">מה השתנה</div><ol className="changes-list">{period.changes.map(change => <li key={change}>{change}</li>)}</ol>
            <div className="map-rule"><span>כלל מפה</span><p>{period.mapNote}</p></div>
            <div className="evidence-note"><strong>איך לקרוא את המפה</strong><p>הפוליגונים הם רקונסטרוקציות אנליטיות. הם מתארים גרעין, השפעה, מחלוקת או נוכחות — לא גבולות מדינה מודרניים.</p></div>
          </>}
        </aside>
      </section>

      <footer className="footerbar"><span>GeoBIBLE V1</span><span>{actors.length} runtime actors · {locations.length} geocoded records · {periods.length} master states</span><span>OpenFreeMap © OpenMapTiles · Data from OpenStreetMap</span></footer>

      {sourcesOpen && <div className="drawer-backdrop" onClick={() => setSourcesOpen(false)}><aside className="sources-drawer" onClick={event => event.stopPropagation()}><button className="drawer-close" onClick={() => setSourcesOpen(false)}>×</button><div className="eyebrow">EVIDENCE & SOURCES</div><h2>מקורות — {period.label}</h2><p>המקורות תומכים במסגרת הטקסטואלית וההיסטורית. גבולות ההשפעה עצמם נשארים שכבת רקונסטרוקציה עם רמת ודאות נפרדת.</p><div className="source-list">{(PERIOD_SOURCES[period.id] ?? []).map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><span>{source.note}</span></a>)}</div><div className="source-method"><span>3 שכבות ודאות</span><ol><li>ודאות טקסטואלית</li><li>ודאות בזיהוי האתר</li><li>ודאות בהיקף הטריטוריאלי</li></ol></div></aside></div>}
    </main>
  )
}
