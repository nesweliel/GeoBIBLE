# Actor–Period States

This directory is the temporal bridge between the canonical actor registry and GIS geometry.

A state answers, for one actor in one historical period:

- What is its political/military status?
- Where is its core control?
- Where does it exert influence?
- Which spaces are contested?
- Who are its allies and enemies?
- What strategic interest is driving its behavior?
- At what map scale should it appear?
- How certain is the reconstruction?

The application should eventually derive map visibility and narrative context from these records rather than from hard-coded period arrays inside React components.

`actor-period-states.v1.json` contains the complete Data Freeze v1 temporal state register: exactly **187 actor-period state records**. The CI data contract validates this exact count and all actor/period foreign keys. Runtime code should treat this file as the canonical temporal source of truth.
