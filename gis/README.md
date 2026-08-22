# GeoBIBLE GIS Foundation

This directory contains historical geography only. Modern administrative borders must never be used as historical evidence.

## Geometry model

Each historical actor may have multiple simultaneous geometries in one period:

- `core_control` — secure political/settlement core
- `influence` — softer sphere of political or military influence
- `contested` — overlapping or disputed space
- `independent_enclave` — an autonomous city or enclave inside a wider strategic space
- `unclear_control` — evidence supports relevance but not ownership
- `campaign_corridor` — a movement/pressure route, never a territorial claim

## Confidence model

Every geometry carries three independent confidence dimensions:

1. `textual` — how clearly the source describes the political/military situation
2. `site_identification` — confidence that the mapped place is correctly identified
3. `spatial_extent` — confidence in the reconstructed boundary/zone

A high-confidence biblical event does **not** automatically imply a high-confidence polygon.

## Rendering rules

- core control: solid but low-opacity fill
- influence: soft translucent fill / feathered edge
- contested: hatch or overlap treatment
- inferred boundary: dashed outline
- independent enclave: compact distinct shape
- approximate site: explicit uncertainty marker
- campaign corridor: narrow directional path, never a giant arrow

## Scale rules

### World
Show only macro actors, regional cultural systems, major sea/land networks and major power transitions.

### Levant
Show kingdoms, city-state systems, major tribal blocs, routes, valleys and regional conflicts.

### Local
Show settlements, passes, ridges, individual tribal control states, battle movements and uncertainty.

## First GIS priorities

1. P08 David in Hebron / Ish-bosheth at Mahanaim / independent Jebusite Jerusalem
2. P07 Gilboa–Jezreel–Beth Shean Philistine pressure corridor
3. P06B Saul at Gibeah–Michmash/Geba pass system
4. P03B Hazor–Kedesh–Tabor–Kishon system
5. P03C Midian/Amalek/eastern raiding corridors
6. P03F Dan west → Laish/Dan migration
7. P02 tribal allotment vs settlement/influence reconstruction

GeoJSON files must preserve evidence notes and confidence. The UI must never silently turn an analytical reconstruction into a factual modern-style border.
