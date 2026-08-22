import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const periods = JSON.parse(fs.readFileSync(path.join(root, 'data/master/periods.v1.json'), 'utf8'))

const errors = []
const ids = new Set()
for (const period of periods) {
  if (!period.id || !period.name || !period.story || !period.map_rule) errors.push(`period missing required fields: ${JSON.stringify(period)}`)
  if (ids.has(period.id)) errors.push(`duplicate period id: ${period.id}`)
  ids.add(period.id)
}

const required = ['P01','P02','P03A','P03B','P03C','P03D','P03E','P03F','P04','P05','P06A','P06B','P06C','P06D','P07','P08']
for (const id of required) if (!ids.has(id)) errors.push(`missing canonical period: ${id}`)

const p08 = periods.find(p => p.id === 'P08')
if (!p08?.story?.includes('ירושלים יבוסית')) errors.push('P08 must preserve independent Jebusite Jerusalem')
if (!p08?.map_rule?.includes('core control')) errors.push('P08 must use control/influence/contested model')

const p03d = periods.find(p => p.id === 'P03D')
if (!p03d?.map_rule?.includes("לא לתייג 'גד נגד אפרים'")) errors.push('P03D correction missing: Gileadites vs Ephraim')

const p03f = periods.find(p => p.id === 'P03F')
if (!p03f?.map_rule?.includes('state גאוגרפי משתנה')) errors.push('Dan migration rule missing')

if (errors.length) {
  console.error('GeoBIBLE data validation failed:')
  for (const error of errors) console.error(` - ${error}`)
  process.exit(1)
}

console.log(`GeoBIBLE data validation passed: ${periods.length} canonical timeline states`)
