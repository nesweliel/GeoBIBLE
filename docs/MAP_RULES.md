# GeoBIBLE Map Rules

## 1. Scale hierarchy

GeoBIBLE uses progressive disclosure. The same period is readable at three levels:

### World / macro
Italy, Aegean, Anatolia, Egypt, Nubia, Levant, Mesopotamia, Iran and northern India.

Show:
- major political/cultural systems
- collapse or emergence of regional powers
- long-distance maritime and overland routes
- only first-order labels

### Levant / operational
Show:
- Philistine system
- Canaanite / Phoenician / Aramean systems
- Ammon, Moab, Edom
- Israelite tribal/political geography
- major valleys, ridges, passes and international corridors

### Local / tactical-historical
Show:
- cities
- forts
- battles
- passes
- local alliances
- campaign routes
- uncertain identifications

## 2. Territorial semantics

Never use one generic colored polygon for every political relationship.

Use separate visual semantics for:
- `core_control`
- `influence`
- `contested`
- `military_presence`
- `recent_change`
- `raid_corridor`
- `migration`

Borders should generally be soft, dashed or confidence-coded rather than modern cadastral borders.

## 3. Timeline behavior

The timeline changes the historical state of the *same geography*.

Examples:
- Dan moves from the western foothills to Laish/Dan after the migration event.
- Egypt changes from late New Kingdom context to Third Intermediate Period dual-core politics.
- Hittite imperial presence disappears and Neo-Hittite polities emerge.
- Jerusalem remains Jebusite until David's later capture.
- After Gilboa, Philistine direct presence and wider influence are rendered separately.

## 4. Resolution and zoom

A single raster image is prohibited as the final basemap.

Final map engine requirements:
- vector tiles for labels / boundaries / routes
- multi-resolution DEM terrain
- hillshade generated from DEM
- zoom-dependent label density
- level-of-detail switching
- high-resolution local data loaded only when needed

This prevents pixelation when zooming from the ancient-world view down to Jerusalem or Gilboa.

## 5. Storytelling

Every period must answer four questions in this order:
1. What was the previous state?
2. What changed?
3. Who gained or lost leverage?
4. Why does the geography explain the outcome?

The map should not rely on arrows alone. Terrain, corridors, settlements, relationships and state changes must jointly tell the story.

## 6. Confidence

Uncertainty is part of the product, not a disclaimer hidden in notes.

Suggested visual language:
- high confidence: solid marker / line
- medium confidence: semi-transparent / dashed
- low confidence: dotted / fuzzy area / approximate label
- unresolved location: regional label with no precise pin
