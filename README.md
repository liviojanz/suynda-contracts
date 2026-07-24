# `@suynda/contracts` v0 (structural)

Shared structural contracts for the Suynda system. Every repo imports this package (or reads its JSON). The Foundation seeds `modules` from it and validates event envelopes against its schema.

**Authority:** derived from `Suynda_Architecture_and_Foundation_Build_v4_3.md` §6.7. If anything conflicts with the architecture contract, the contract wins.

## What lives here

| Artifact | Path | Notes |
|---|---|---|
| Enums | `data/enums.json` + `src/enums.ts` | `ModuleKey`, roles, identity types, `PlanKey` keys (not prices) |
| Modules seed | `data/modules.json` | 15 keys; Foundation seeds its table from this |
| Event catalog | `data/events.json` | `noun.verb_past`, versioned |
| Event envelope schema | `schema/event-envelope.schema.json` | **Closed** (`additionalProperties: false`) |
| Reference convention | `schema/reference.schema.json` + `src/reference.ts` | Cache columns for cross-module refs |
| Capabilities | `data/capabilities.json` | availability + initiator (rows proposed) |
| Error codes | `data/error-codes.json` | Stable namespaced codes (rows proposed) |
| Metered operations | `data/metered-operations.json` | **keys + descriptions only** — no costs |

## What does **not** live here

Commercial values — credit costs, plan prices, combo bonus, overdraft windows — live in Foundation config tables (`operation_costs`, `module_plans`, `commercial_config`), editable from `/admin` without deploy. A price or credit cost hardcoded in this package is a rejected change.

## Consume from TypeScript

```bash
npm install @suynda/contracts
# or, while private/local:
# "dependencies": { "@suynda/contracts": "file:../suynda-contracts" }
```

```ts
import {
  MODULES,
  MODULE_KEYS,
  EVENTS,
  METERED_OPERATIONS,
  ERROR_CODES,
  CAPABILITIES,
  validateEnvelope,
  type EventEnvelope,
  type ModuleKey,
  type MeteredOperation,
} from "@suynda/contracts";

// Seed Foundation modules table from MODULES
// Resolve metered op keys from METERED_OPERATIONS (costs from config elsewhere)

const result = validateEnvelope(payload);
if (!result.ok) {
  // result.errors — unknown fields rejected
}
```

JSON Schema and data files are also exported:

```ts
// package exports:
//   @suynda/contracts          → dist (types + validateEnvelope)
//   @suynda/contracts/data/*   → data/*.json
//   @suynda/contracts/schema/* → schema/*.json
```

## Consume from Python

The canonical definitions are language-neutral JSON. Do not re-declare lists.

```python
import json
from pathlib import Path

# After installing the npm package (or vendoring the repo):
root = Path("node_modules/@suynda/contracts")  # or path to this repo
modules = json.loads((root / "data/modules.json").read_text(encoding="utf-8"))
events = json.loads((root / "data/events.json").read_text(encoding="utf-8"))
envelope_schema = json.loads(
    (root / "schema/event-envelope.schema.json").read_text(encoding="utf-8")
)
# Validate with jsonschema / referencing against envelope_schema
```

## Versioning

- Semver; this package starts at `0.1.0`. The release `v0.1.0` is tagged in git.
- Structural changes during Foundation phases 1–3 bump the minor.
- Metered-operation **keys** may still be added (minor, additive) before phase 4.
- **Values never enter this package** — they live in Foundation config.

> **The tag is a marker, not a pin (today).** The consumers (`suynda-foundation`,
> `suynda-padron`) depend on this package via `"@suynda/contracts": "file:../suynda-contracts"`
> — a filesystem symlink. They therefore always compile against the **working-tree
> HEAD** of this repo, regardless of which tag exists: a breaking change here reaches
> both consumers immediately, with no version gate. `v0.1.0` records "this is the
> contract as of now"; it does **not** pin anyone to it. To make the tag a real pin,
> publish the package (registry or versioned tarball) and switch the consumers to a
> semver range (`"@suynda/contracts": "^0.1.0"`). Until then, bump the version + move
> the tag on every contract change, and treat any change here as affecting all
> consumers at once.

## Build

```bash
npm install
npm run build   # `prebuild` regenerates the envelope schema enums from data/ first
```

The `event` / `origen_module` enums in `schema/event-envelope.schema.json` are
**generated** from `data/events.json` and `data/modules.json` by
`scripts/generate-schema.mjs` (run as `prebuild`). Do not hand-edit those enums —
edit the data files and rebuild.

## Rules for contributors

- Scaffolding / types / data only. The sole runtime logic is `validateEnvelope()`.
- No free strings for lists owned here — import the enum or the JSON.
- Envelope schema stays closed: unknown fields must fail validation.
- No `creditos`, prices, or commercial numbers in any file.
