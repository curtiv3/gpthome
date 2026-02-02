# Epic: Frontend Governance & Skill Integration

**Epic ID:** E0-GOV-02
**Status:** Ready for Implementation
**Dependencies:** None (introduces its own prerequisite story)
**Blocked By:** None

---

## Epic Description

This epic formally installs the "Frontend Governance" skill into the repository's AI context, ensuring that all future UI generation adheres to the "Contemplative" design system and "Anti-Slop" protocols. It involves:

1. Configuring the typography stack with intentional font pairings
2. Creating the binding `SKILL.md` artifact with project-aligned semantic tokens
3. Referencing it in the root `GPT.md` to ensure automatic activation
4. Performing a "Vibe Check" validation documented via PR review

This creates a hard quality gate for Phase 1 UI work.

---

## Resolved Design Decisions

The following gaps were identified during Staff-level review and resolved:

| Decision                    | Resolution                                                                                                                     | Rationale                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **Token Naming**            | SKILL.md uses existing `globals.css` tokens (`void`, `surface`, `elevated`, `text-primary`, `text-secondary`, `text-tertiary`) | Code is source of truth; governance aligns to deployed reality                         |
| **Font Policy**             | Mandate specific fonts (e.g., Bricolage Grotesque headings, JetBrains Mono data) via `next/font`                               | "Contemplative" design requires distinct visual voice; system fonts cause "SaaS Drift" |
| **Skill Activation**        | Automatic via GPT.md binding; always active for UI tasks                                                                       | Frictionless governance; removes human error in skill invocation                       |
| **Radix/shadcn**            | Add as prerequisite dependency in future epic (E1-SHELL-01 or precursor)                                                       | Cannot mandate unavailable tooling; dependency story required                          |
| **`<design_intent>` Block** | Ephemeral (conversation only); NEVER committed to codebase                                                                     | Protocol Zero compliance; meta-cognitive tool, not production artifact                 |
| **Vibe Check Audit Trail**  | GitHub PR comment with screenshots on binding PR                                                                               | Lightweight, contextual, persistent; avoids repository bloat                           |
| **Font Delivery**           | Prerequisite story S-GOV-04.5 before SKILL.md authoring                                                                        | "Dependencies before Usage"; separate implementation from governance                   |

---

## Story Table

| Order | Story ID   | Story Title                        | Description                                                                                                                                                                                                                                                                                           | Points | Acceptance Criteria                                                                                                                                                                                                                                                                                                                                             |
| ----- | ---------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | S-GOV-04.5 | Configure Typography Stack         | Install and configure intentional font pairings using `next/font`. Add serif/display heading font (e.g., Bricolage Grotesque, Playfair Display) and monospace data font (JetBrains Mono). Update `globals.css` with `--font-heading` and `--font-data` CSS variables under `@theme`.                  | 2      | 1. Fonts installed via `next/font/google` or `next/font/local`.<br>2. `globals.css` contains `--font-heading` and `--font-data` tokens.<br>3. Fonts render correctly in dev server.<br>4. No FOUT/FOIT in production build.                                                                                                                                     |
| 2     | S-GOV-05   | Author Frontend Skill Contract     | Create `.gpt/skills/frontend-development/SKILL.md` containing strict design governance rules. Token references MUST match existing `globals.css` definitions. Metadata header includes `name: frontend-governance` and `description`.                                                                 | 1      | 1. File exists at `.gpt/skills/frontend-development/SKILL.md`.<br>2. Metadata header is valid YAML.<br>3. Semantic tokens match `globals.css` (`void`, `surface`, `text-primary`, etc.).<br>4. Forbidden patterns explicitly listed.<br>5. `<design_intent>` documented as ephemeral (conversation-only).                                                       |
| 3     | S-GOV-06   | Bind Skill to Project Context      | Update root `GPT.md` Section 4 (Frontend Standards) to mandate automatic activation of `frontend-governance` skill for all UI tasks. Add explicit "Anti-Slop" warning. Define "UI task" trigger criteria.                                                                                             | 1      | 1. `GPT.md` Section 4 contains skill reference.<br>2. Language mandates activation (not optional).<br>3. "UI task" defined (files matching `*.tsx`, `*.css` in `apps/web/src/`).<br>4. "Anti-Slop" / "Vibe Coding" warning present.                                                                                                                             |
| 4     | S-GOV-07   | Governance Validation (Vibe Check) | Perform manual validation by prompting GPT to generate a dashboard card WITH the skill active. Verify `<design_intent>` block appears in conversation, output uses semantic tokens, and aesthetic aligns with "Contemplative" design. Document results as PR comment on S-GOV-06 PR with screenshots. | 2      | 1. PR comment contains before/after comparison or skill-active output.<br>2. `<design_intent>` block visible in conversation transcript.<br>3. Generated code uses `bg-void`, `text-primary` (not `bg-gray-900`, `text-white`).<br>4. No forbidden patterns present (gradient crutch, rounded-xl addiction, skeleton aesthetic).<br>5. Reviewer sign-off on PR. |

---

## Out of Scope

The following items are explicitly NOT part of this epic:

1. **Radix UI / shadcn installation** - Deferred to E1-SHELL-01 or a dedicated dependency epic. SKILL.md will use language "Prefer Radix/shadcn primitives when available" rather than hard mandate.
2. **Automated CI enforcement of design rules** - Future epic for ESLint/Stylelint plugins.
3. **CODEOWNERS for `.gpt/skills/`** - Evaluate after skills directory matures.
4. **Visual reference library / Figma** - Design system documentation is a separate initiative.

---

## Technical Notes

### Token Mapping Reference

SKILL.md must reference these exact tokens from `globals.css`:

```css
/* Background Layers */
--color-void         /* Deepest black (body bg) */
--color-surface      /* Card backgrounds */
--color-elevated     /* Modals, popovers */

/* Text Hierarchy */
--color-text-primary    /* Main text */
--color-text-secondary  /* Muted text */
--color-text-tertiary   /* Disabled/hints */

/* Accent Colors */
--color-accent-warm     /* Warm amber */
--color-accent-cool     /* Cool blue */
--color-accent-dream    /* Purple */

/* Typography (after S-GOV-04.5) */
--font-heading          /* Display/serif for headings */
--font-data             /* Monospace for data */
```

### Protocol Zero Compliance

- `<design_intent>` blocks are ephemeral; they appear in GPT's response but are NEVER committed
- SKILL.md itself does not contain AI attribution markers
- Commit messages for this epic follow standard Conventional Commits format

### UI Task Definition

For GPT.md binding, a "UI task" is defined as any task that:

- Creates or modifies files matching `apps/web/src/**/*.tsx`
- Creates or modifies files matching `apps/web/src/**/*.css`
- Explicitly mentions "component", "page", "layout", "styling", or "design"

---

## Risk Register

| Risk                                       | Likelihood | Impact | Mitigation                                                                     |
| ------------------------------------------ | ---------- | ------ | ------------------------------------------------------------------------------ |
| Font loading performance regression        | Low        | Medium | Use `next/font` with `display: swap`; measure LCP before/after                 |
| Subjective aesthetic disagreements         | Medium     | Low    | PR review provides human judgment gate; iterate on SKILL.md as patterns emerge |
| Skill not activated due to unclear trigger | Low        | High   | Explicit file pattern triggers documented in GPT.md                            |

---

## Definition of Done

- [ ] S-GOV-04.5: Typography stack configured and rendering
- [ ] S-GOV-05: SKILL.md authored with correct token references
- [ ] S-GOV-06: GPT.md updated with mandatory skill binding
- [ ] S-GOV-07: Vibe Check passed with PR comment documentation
- [ ] All stories pass `pnpm lint`, `pnpm typecheck`, `pnpm build`
- [ ] All commits pass `./tools/protocol-zero.sh`
