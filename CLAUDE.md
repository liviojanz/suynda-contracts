# CLAUDE.md — `@suynda/contracts`

Structural contracts package (`@suynda/contracts`). Scaffolding, types, and data only — no business logic beyond `validateEnvelope()`.

**The architecture contract now lives in git, in this repo** (§0.1, v4.4): `docs/Suynda_Architecture_and_Foundation_Build_v4_4.md`. It is the authority; do not restate the architecture here. The brain node `G:\My Drive\Context System\context\ventures\suynda\architecture.md` orients to it.

Contract governance (§0.1 — LOCKED):
- **No agent edits the contract.** If the code and the contract disagree, **report the discrepancy** — do not edit the doc to match the code. The discrepancy is resolved above, deciding which side is wrong.
- Every change bumps the version (a new `..._v4_5.md`, by commit with a reviewable diff), never an in-place edit. An earlier in-place edit of v4.3 in OneDrive is exactly what this rule prevents.

Commercial values (credit costs, plan prices, bonus, overdraft) never enter this package — they belong to Foundation config tables.
