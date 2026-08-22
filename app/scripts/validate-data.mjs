import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const master = path.join(root, 'data/master')
const read = file => JSON.parse(fs.readFileSync(path.join(master, file), 'utf8'))
const readParts = prefix => fs.readdirSync(master)
  .filter(file => file.startsWith(prefix) && file.endsWith('.json'))
  .sort()
  .flatMap(read)

const periods = read('periods.v1.json')
const actors = readParts('actors.v1.part')
const locations = readParts('locations.v1.part')
const relations = read('relations.v1.json')
const routes = read('routes.v1.json')
const judges = read('judges-events.v1.json')
const gaps = read('validation-gaps.v1.json')
const sources = read('sources.v1.json')

const errors = []

function assertUnique(records, label) {
  const ids = new Set()
  for (const record of records) {
    if (!record.id) errors.push(`${label}: record missing id`)
    if (ids.has(record.id)) errors.push(`${label}: duplicate id ${record.id}`)
    ids.add(record.id)
  }
  return ids
}

const periodIds = assertUnique(periods, 'periods')
const actorIds = assertUnique(actors, 'actors')
const locationIds = assertUnique(locations, 'locations')
assertUnique(relations, 'relations')
assertUnique(routes, 'routes')
assertUnique(judges, 'judges-events')
assertUnique(gaps, 'validation-gaps')
assertUnique(sources, 'sources')

const expectedCounts = {
  periods: [periods, 16],
  actors: [actors, 52],
  locations: [locations, 93],
  relations: [relations, 24],
  routes: [routes, 11],
  judges: [judges, 15],
  gaps: [gaps, 22],
  sources: [sources, 28],
}
for (const [label, [records, expected]] of Object.entries(expectedCounts)) {
  if (records.length !== expected) errors.push(`${label}: expected ${expected}, found ${records.length}`)
}

const requiredPeriods = ['P01','P02','P03A','P03B','P03C','P03D','P03E','P03F','P04','P05','P06A','P06B','P06C','P06D','P07','P08']
for (const id of requiredPeriods) if (!periodIds.has(id)) errors.push(`missing canonical period: ${id}`)

for (const period of periods) {
  if (!period.name || !period.story || !period.map_rule || !period.confidence) {
    errors.push(`period ${period.id} missing required narrative fields`)
  }
}

for (const location of locations) {
  const hasLat = location.lat !== null && location.lat !== undefined
  const hasLon = location.lon !== null && location.lon !== undefined
  if (hasLat !== hasLon) errors.push(`location ${location.id} must have both lat/lon or neither`)
  if (hasLat && (location.lat < -90 || location.lat > 90 || location.lon < -180 || location.lon > 180)) {
    errors.push(`location ${location.id} has invalid coordinates`)
  }
}

for (const route of routes) {
  if (!route.name || !route.corridor || !route.strategic_role) errors.push(`route ${route.id} missing route metadata`)
}

for (const relation of relations) {
  if (!relation.period || !relation.type || !relation.party_a || !relation.party_b) {
    errors.push(`relation ${relation.id} missing relationship fields`)
  }
}

const levi = actors.find(actor => actor.id === 'A014')
if (!levi?.geometry?.includes('לא פוליגון')) errors.push('Levi must remain non-territorial')

const dan = actors.find(actor => actor.id === 'A010')
if (!dan?.notes?.includes('P03F')) errors.push('Dan must preserve geographic state transition at P03F')

const mahanaim = locations.find(location => location.id === 'L003')
if (mahanaim?.confidence !== 'בינונית' || !mahanaim?.notes?.includes('משוערת')) {
  errors.push('Mahanaim must remain explicitly approximate')
}

const ziklag = locations.find(location => location.id === 'L089')
if (ziklag?.lat !== null || ziklag?.lon !== null) errors.push('Ziklag must not receive fabricated coordinates in v1')

const p08 = periods.find(period => period.id === 'P08')
if (!p08?.story?.includes('ירושלים יבוסית')) errors.push('P08 must preserve independent Jebusite Jerusalem')
if (!p08?.map_rule?.includes('core control')) errors.push('P08 must use control/influence/contested model')

const p03d = periods.find(period => period.id === 'P03D')
if (!p03d?.map_rule?.includes("לא לתייג 'גד נגד אפרים'")) errors.push('P03D correction missing: Gileadites vs Ephraim')

const p03f = periods.find(period => period.id === 'P03F')
if (!p03f?.map_rule?.includes('state גאוגרפי משתנה')) errors.push('Dan migration rule missing')

const benjaminWar = judges.find(event => event.id === 'J15')
if (!benjaminWar?.confidence?.includes('כרונולוגיה')) errors.push('Benjamin civil war must preserve chronology uncertainty')

const unresolved = locations.filter(location => location.lat === null || location.lon === null)
if (unresolved.length === 0) errors.push('Data contract unexpectedly contains no unresolved locations; check for fabricated precision')

if (errors.length) {
  console.error('GeoBIBLE data validation failed:')
  for (const error of errors) console.error(` - ${error}`)
  process.exit(1)
}

console.log('GeoBIBLE data validation passed')
console.log(JSON.stringify({
  periods: periods.length,
  actors: actors.length,
  locations: locations.length,
  unresolvedLocations: unresolved.length,
  relations: relations.length,
  routes: routes.length,
  judgesEvents: judges.length,
  validationGaps: gaps.length,
  sources: sources.length,
}, null, 2))
