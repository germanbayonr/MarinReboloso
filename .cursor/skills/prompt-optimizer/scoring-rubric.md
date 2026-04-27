# Scoring rubric (1–10 anchors)

Use these as **guides**, not rigid laws. Calibrate: **5** = usable but clearly improvable; **8** = strong for its purpose; **10** = exemplary, hard to improve without scope creep.

## Prompt mode

### C — Clarity

- **1–3:** Core ask buried; vague terms; multiple conflicting readings.
- **4–5:** Main task guessable; important terms undefined.
- **6–7:** Unambiguous for a typical assistant; minor ambiguities.
- **8–9:** Crisp ask; terms scoped; little room for misread.
- **10:** Any reasonable model parses intent and success criteria the same way.

### S — Specificity

- **1–3:** No format, length, tone, or constraints.
- **4–5:** Some constraints; output shape still fuzzy.
- **6–7:** Clear deliverable type; key constraints listed.
- **8–9:** Explicit structure, acceptance checks, or examples.
- **10:** Constraints and “done” are operational (testable).

### T — Structure

- **1–3:** Wall of text; no hierarchy.
- **4–5:** Partial grouping; hard to scan.
- **6–7:** Sections or bullets; logical order.
- **8–9:** Clear sections (context / task / constraints / output).
- **10:** Scannable in seconds; order matches dependency chain.

### O — Completeness

- **1–3:** Missing inputs, audience, or failure mode.
- **4–5:** Main path only; edges hand-waved.
- **6–7:** Covers normal case + a few edges or errors.
- **8–9:** Context, examples, edge cases, or “if blocked” guidance.
- **10:** Few realistic gaps left without over-scoping.

### E — Efficiency

- **1–3:** Repetition, storytelling, or filler dominates.
- **4–5:** Some redundancy or generic advice.
- **6–7:** Mostly tight; a few trimmable lines.
- **8–9:** High signal; minimal repetition.
- **10:** Every line earns its place.

### R — Robustness

- **1–3:** Luck-dependent; contradictory instructions.
- **4–5:** Works sometimes; brittle phrasing.
- **6–7:** Stable for common variance; a few ambiguity traps.
- **8–9:** Consistent outputs across paraphrases and models.
- **10:** Explicit guardrails, ordering, or checks reduce variance.

## Rules mode

### C — Clarity

Same spirit as Prompt Clarity, but for **ongoing behavior**: triggers, obligations, and prohibitions must be readable without project context where possible.

### SF — Scope Fit

- **1–3:** Applies to everything or almost nothing; wrong granularity.
- **4–5:** Obvious over- or under-breadth.
- **6–7:** Mostly right scope; a few fuzzy boundaries.
- **8–9:** Clear when the rule applies; minimal leakage.
- **10:** Precise activation conditions; no unnecessary global cost.

### T — Structure

- **1–3:** Dense paragraph; hard to re-scan each chat.
- **4–5:** Some lists; still mixed concerns.
- **6–7:** Bullets, headings, or numbered priorities.
- **8–9:** Fast to skim; separation of MUST vs SHOULD vs MAY.
- **10:** Optimized for repeated injection — minimal tokens, maximum clarity.

### Cov — Coverage

- **1–3:** Misses obvious scenarios the rule should govern.
- **4–5:** Main scenario only.
- **6–7:** Main + common variants.
- **8–9:** Thoughtful gaps filled without enumerating every edge.
- **10:** Right level of generality; no false precision.

### E — Efficiency (token cost)

Rules run **every** conversation:

- **1–3:** Long essays, duplicated ideas, or generic platitudes.
- **4–5:** Trimmable without losing behavior.
- **6–7:** Reasonable length for the value.
- **8–9:** Tight; could only shorten with tradeoffs.
- **10:** Maximum behavior per token; no boilerplate.

### Comp — Composability

- **1–3:** Conflicts with typical defaults or other rules likely.
- **4–5:** Ambiguous priority vs other instructions.
- **6–7:** Mostly compatible; watch for overlap.
- **8–9:** Explicit precedence or non-overlap with sibling rules.
- **10:** Clearly scoped; plays well with project + user rules.

## Composite and overrides

Default: **composite** = mean of six scores, **one decimal**. If the user assigns weights, recompute and state the formula once in the session.
