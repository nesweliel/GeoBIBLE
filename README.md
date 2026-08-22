# GeoBIBLE

GeoBIBLE is a time-driven historical geospatial atlas for the ancient Near East, centered on the evolution of Israelite sovereignty, tribal geography, alliances, conflict, trade routes, and regional powers.

## Product principle

**Timeline → historical state → map → explanation.**

The map is not a static illustration. Every actor, location, alliance, route, control zone, and conflict is resolved through a period-specific state model.

## Geographic scope

The atlas is designed to scale from a regional world view covering Italy, Greece, Anatolia, Egypt, Nubia, the Levant, Mesopotamia, Iran and northern India, down to local views such as Jerusalem, Hebron, Mahanaim, Gilboa, Beth Shean and the Philistine cities.

## Repository structure

- `data/master/` — canonical historical data and data-freeze snapshots
- `data/actors/` — tribes, peoples, kingdoms, city-states and cultural regions
- `data/periods/` — timeline states and sub-events
- `data/locations/` — cities, battles, passes and uncertain identifications
- `data/relations/` — alliances, wars, dependencies and rivalries
- `data/routes/` — strategic roads, river corridors and maritime networks
- `gis/` — future GeoJSON / vector datasets and territorial reconstructions
- `research/` — sources, chronology notes and unresolved questions
- `docs/` — data model, map rules and UX strategy
- `app/` — the future interactive atlas application

## Historical rules

- Tribal allotments are not treated as modern borders.
- Core control, influence and contested space are separate concepts.
- Uncertain site locations remain explicitly uncertain.
- Levi is represented as a non-territorial institutional network.
- Dan changes geographic state over time.
- Mahanaim is treated as an approximate location.
- Jerusalem/Jebus remains an independent Jebusite city before David's capture.
- Philistine presence after Gilboa distinguishes direct presence, influence and abandoned settlements.
- Aram is not represented as one giant Aram-Damascus state throughout the timeline.
- Nubia is not represented as a unified Kushite kingdom in Saul/David's period.

## Current milestone

**Data Freeze v1** — consolidate the full historical knowledge base before redesigning the map engine and UI.

The next product milestone begins only after unresolved GIS and chronology questions are explicitly tracked and the core data model is stable.
