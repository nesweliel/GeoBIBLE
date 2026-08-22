# GeoBIBLE UX Strategy

## Product metaphor

**Ancient library / royal archive — not fantasy parchment.**

The visual system should feel like entering a serious historical archive: limestone, papyrus, dark wood, bronze, ink, restrained lapis/malachite/terracotta accents. The map itself remains modern, legible and geospatially precise.

## Primary user journey

1. User enters at a world-scale historical view.
2. The timeline is immediately visible and is the primary navigation.
3. Selecting a period updates the same map instead of loading a separate illustration.
4. A short story panel explains context → turning point → result.
5. The user can descend from world → Levant → local scale.
6. More detailed layers appear only when they become useful.
7. Clicking an actor or place opens a focused knowledge card with sources and confidence.
8. A compare mode can show what changed from the previous period.

## Information hierarchy

### Always visible
- period / timeline
- current chapter title
- map
- one-sentence thesis
- scale indicator

### Secondary
- key actors
- strategic changes
- core routes
- confidence legend

### On demand
- tribal allotments
- local settlements
- archaeological uncertainty
- full source references
- detailed alliances and rivalries

## Progressive disclosure

Do not show the same information at every zoom.

### World zoom
Show only macro systems and major routes.

### Levant zoom
Show regional peoples, kingdoms, corridors and strategic terrain.

### Local zoom
Show tribes, cities, battles, passes, local alliances and disputed identifications.

## Story mode vs explore mode

### Story mode
Guided historical sequence. The user is taken through a curated narrative and the camera moves to the geography relevant to each turning point.

### Explore mode
The user controls zoom, actors, layers, periods and comparisons.

Both modes use the same canonical data.

## Interaction rules

- Never hide the timeline behind a menu.
- Never cover a large percentage of the map with permanent panels.
- Side panels must collapse.
- Avoid giant arrows that obscure geography.
- Prefer selected highlights and animated route traces.
- Labels must change density with zoom.
- A click must explain not only *what* a place is, but *why it matters in this period*.

## Historical card structure

For any selected actor/location:

**Name**

**Status in current period**

**Strategic interest**

**Allies / rivals**

**Why this geography matters**

**What changed from previous period**

**Confidence**

**Sources**

## Core design objective

The user should be able to answer, without reading a long essay:

> Who controls what, who wants what, why this terrain matters, and what changed because of the last event?
