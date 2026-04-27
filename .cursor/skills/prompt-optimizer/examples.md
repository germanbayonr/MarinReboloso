# Example walkthroughs (abbreviated)

Full sessions follow **SKILL.md** steps 1–8. Below are **illustrative** before/after fragments — not literal score truth for every model.

---

## Example A — Prompt mode (low → mid)

**v1 (baseline, excerpt):**

> Write something good about our product for the landing page.

**Scorecard sketch:** C 3, S 2, T 4, O 2, E 6, R 3 → composite ~3.3. Weakest: Specificity, Completeness.

**Greedy fix:** Add audience, length, tone, one structural constraint, and success criteria (targets S and O without touching a hypothetical high Clarity later).

**v2 (excerpt):**

> Write landing-page copy for **[product]**.
> Audience: **[who]**; tone: **[adjective]**; length: **~N words**.
> Structure: headline, 3 benefit bullets, CTA line.
> Avoid superlatives we cannot prove. If **[input]** is missing, ask one clarifying question then proceed with labeled assumptions.

**Follow-up:** Re-score; next iteration might tighten Efficiency (merge redundant lines) once Composite approaches 8+.

---

## Example B — Rules mode (scope + efficiency)

**v1 (baseline, excerpt):**

> Always be extremely helpful and never make mistakes and use best practices for everything in the codebase and remember every detail from prior chats.

**Issues:** Scope too broad (SF), token-heavy platitudes (E), conflicts with reality/other rules (Comp).

**Greedy fix:** Replace global absolutes with **scoped MUST** items and **brevity**.

**v2 (excerpt):**

> In this repo, when editing **TypeScript/React**:
> - MUST preserve existing patterns (imports, naming, file layout).
> - MUST not add dependencies unless the user asks.
> - SHOULD keep edits minimal and explain only non-obvious choices.
> Conflicts with other rules: **user rules win**, then project rules.

---

## Example C — Ambiguous input

User pastes text that both defines a persona **and** asks for a one-off report.

**Agent action:** Ask confirmation — *Prompt vs Rules* — then proceed with the correct scorecard.

---

## Delta illustration (Prompt mode)

```
== Prompt Scorecard v1 ==
Clarity:      6/10
...
Composite:    5.2/10

== Prompt Scorecard v2 ==
Clarity:      6/10  (=)
Specificity:  5/10  (+2)
...
Composite:    6.0/10  (+0.8)
```

Version history row for v2: `| v2 | 6 | 5 | … | 6.0 | added output schema + constraints |`
