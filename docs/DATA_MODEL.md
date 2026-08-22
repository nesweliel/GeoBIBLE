# GeoBIBLE Data Model

## Core rule

The atlas is **timeline-first**. Geography is rendered from period-specific state, not from one permanent set of borders.

## Primary entities

### Actor
A tribe, people, kingdom, city-state network, cultural region, polity, house, or other historical agent.

Required fields:
- `id`
- `name`
- `category`
- `subtype`
- `periods`
- `interests`
- `relations`
- `rivals`
- `geometry_type`
- `map_scale`
- `biblical_confidence`
- `archaeological_confidence`
- `notes`
- `sources`

### Period
A historical state or sub-state. Periods may be narrative-sequential without claiming a precise absolute year.

Required fields:
- `id`
- `name`
- `book_phase`
- `date_model`
- `story`
- `key_geography`
- `main_actors`
- `map_rule`
- `confidence`
- `sources`

### ActorPeriodState
The central engine object. It determines what an actor looks like in a specific period.

Required fields:
- `period_id`
- `actor_id`
- `status`
- `core_control`
- `influence`
- `contested`
- `allies`
- `enemies`
- `interest`
- `visibility_scale`
- `certainty`
- `notes`
- `sources`

### Location
Cities, forts, battlefields, mountains, passes, rivers, regions and uncertain identifications.

If a location is uncertain, coordinates may be `null`. We do not fabricate precision.

### Relation
Alliance, war, patronage, dependency, neutrality, rivalry, migration, coalition, civil war or other relationship between actors.

### Route
A road, river corridor, mountain pass system, maritime network, migration route or campaign corridor.

## Confidence model

The UI must ultimately distinguish at least three confidence dimensions:
1. **Textual confidence** — how explicit the literary source is.
2. **Location confidence** — confidence in the archaeological/geographic identification.
3. **Territorial confidence** — confidence in reconstructed control/influence boundaries.

These must never be collapsed into one generic certainty score.

## Non-negotiable historical rules

- Tribal allotment is not equivalent to effective political control.
- Levi has no continuous territorial polygon.
- Dan changes geography over time: western foothills → Laish/Dan migration state.
- Mahanaim remains an approximate location.
- Jerusalem/Jebus remains an independent Jebusite stronghold before David's capture.
- Philistine post-Gilboa rendering separates direct presence, influence and abandoned/occupied settlements.
- Amalek and Midian are not rendered as modern-style territorial states when the evidence is better represented as mobile raiding networks.
- Aram is rendered as multiple emerging Aramean polities rather than a single giant Aram-Damascus state throughout the timeline.
- Nubia is not rendered as a unified Kushite kingdom in Saul/David's period.
- Italy, Greece, Turkey and India are not rendered as modern states in the ancient map. They appear as period-appropriate cultural/political systems.
