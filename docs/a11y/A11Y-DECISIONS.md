# A11Y Decisions Log (Pattern Memory)

> **Purpose:** cross-turn memory of choices between **equally conformant alternatives**. Two implementations can both pass `A11Y.md` and axe and still diverge (different `role`, focus pattern, announcement wording) — twenty compliant modals, zero coherence. This file prevents that.

## Rules for the AI

1. **Record only what is not derivable** from `A11Y.md` rules or from the code itself. Landmarks, headings, and alt presence are machine-verifiable — they do **NOT** belong here.
2. **Index by pattern, never by screen.** ✅ *"Destructive confirmation modal → `alertdialog`"* · ❌ *"The dispute modal does X"*.
3. **One line per decision:** pattern → choice → short why.
4. **Read before building:** before generating any interactive component, check this log and reuse the recorded pattern (see *Component Reuse* in the AI Behavior Contract).
5. **Never fork silently:** if a new requirement contradicts a recorded decision, ask the user — do not create a parallel variant.
6. **Stay lean:** tens of lines, not hundreds. This file shares the context budget with Lazy Loading; if it grows past ~40 entries, consolidate.
7. **Versioned, never gitignored:** this is *shared* memory — across turns, agents and developers. A local-only copy per developer forks the patterns and defeats the file's entire purpose.

## Decisions

<!-- Append entries below. Format: - **Pattern** → choice — why. (date) -->

- **On-screen keyboard sizing on narrow/zoomed viewports** (Pshaw, `src/app/pshaw/pshaw-board.tsx`) → below the `sm:` breakpoint, letter keys shrink to `h-9 w-7` (~28×36px) and Enter/Backspace shrink correspondingly, rather than holding the 44×44px house-rule floor and letting the 10-key row force horizontal scroll. Chosen because SC 1.4.10 (Reflow, normative WCAG AA) outranks the 44px house rule (non-normative); keys never drop below the WCAG AA 24×24px target-size floor (SC 2.5.8), so both the low-vision/zoom population (needs reflow) and the motor-impaired population (wants larger targets) can still complete the guess — only the horizontal-scroll case was a hard blocker. Reuse this shrink-below-`sm:`-rather-than-scroll pattern for any other dense control row (e.g. a future on-screen keyboard elsewhere in the app). (2026-08-11)
