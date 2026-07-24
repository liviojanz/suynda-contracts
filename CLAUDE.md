# CLAUDE.md — `@suynda/contracts`

Structural contracts package (`@suynda/contracts`). Scaffolding, types, and data only — no business logic beyond `validateEnvelope()`.

**The architecture contract lives in git, in this repo, at a fixed path** (§0.1): `docs/ARCHITECTURE.md`. It is the authority; do not restate the architecture here. Its version is inside the document header and git carries the history — the filename never changes, so a version bump touches no pointers. The brain node `G:\My Drive\Context System\context\ventures\suynda\architecture.md` orients to it.

Contract governance (§0.1 — LOCKED):
- **No agent edits the contract.** If the code and the contract disagree, **report the discrepancy** — do not edit the doc to match the code. The discrepancy is resolved above, deciding which side is wrong.
- Every change bumps the version (a commit with a reviewable diff — the version lives in the header, not the filename), never an in-place edit. An earlier in-place edit of v4.3 in OneDrive is exactly what this rule prevents.

Commercial values (credit costs, plan prices, bonus, overdraft) never enter this package — they belong to Foundation config tables.
