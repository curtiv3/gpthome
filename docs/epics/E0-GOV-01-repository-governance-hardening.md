# Epic: Repository Governance & Hardening

**Epic ID:** E0-GOV-01
**Status:** Reviewed & Approved
**Reviewed By:** Staff Engineer (Gap Analysis Complete)
**Last Updated:** 2026-01-15

---

## Epic Description

This epic bootstraps the repository infrastructure using the `gh` CLI to enforce a "secure-by-default" posture. It transitions from legacy branch protection documentation to modern GitHub Repository Rulesets, enforcing granular access controls, mandating linear history via strict squash-merging, and Code Owner reviews while allowing Repository Admin bypass for emergency fixes. The scope includes automating repository hygiene (auto-deletion of branches, noise-reduced Dependabot grouping with auto-merge for minor/patch updates) to ensure the repository operates with high signal-to-noise ratio and zero administrative toil.

---

## Governance & Compliance

### No-AI Attribution Policy (Protocol Zero)

This epic operates under **strict Protocol Zero enforcement** as defined in `CLAUDE.md`.

- All commits, PRs, and code artifacts MUST be free of AI attribution
- All files created by this epic MUST pass `./tools/protocol-zero.sh`
- Repository Ruleset bypass capability does NOT exempt Protocol Zero requirements
- Dependabot auto-merged PRs are scanned by Protocol Zero in CI before merge

**Enforcement Points:**

1. Local: Pre-commit hook runs `protocol-zero.sh` on all governance files
2. CI: Protocol Zero job validates all PR branches before merge
3. Ruleset: Bypass does NOT disable CI requirement for Protocol Zero job

---

## Key Decisions (Gap Resolution)

| Decision               | Resolution             | Rationale                                                         |
| ---------------------- | ---------------------- | ----------------------------------------------------------------- |
| Repository Structure   | Individual Repository  | Single owner (`@dinesh-git17`), no GitHub Organization teams      |
| Ruleset Bypass         | Repository Admins Only | Simple, standard, secure; prevents shadow bypass teams            |
| Dependabot Review      | Exempt Minor/Patch     | Toil reduction; CI passing is sufficient for non-breaking updates |
| Documentation Strategy | Deprecate & Replace    | Delete `BRANCH_PROTECTION.md`; document Rulesets instead          |

---

## Scope Boundaries

### In Scope

- Repository settings via `gh` CLI
- GitHub Repository Rulesets for `main` branch
- `.github/CODEOWNERS` (individual owner syntax)
- `.github/dependabot.yml` (npm ecosystem only)
- Dependabot auto-merge automation

### Out of Scope (Deferred to Phase 2)

- Python/pip ecosystem configuration (no backend service yet)
- Organization-level Rulesets (individual repo only)
- Signed commit enforcement (optional enhancement)

---

## Prerequisites

| Prerequisite               | Status   | Notes                                                  |
| -------------------------- | -------- | ------------------------------------------------------ |
| `gh` CLI installed         | Required | Version 2.x+ with `repo` and `admin:repo_hook` scopes  |
| Authenticated `gh` session | Required | `gh auth status` must return authenticated             |
| Repository exists          | Required | `dinesh-git17/claudehome` or equivalent                |
| CI workflows deployed      | Required | `quality.yml` and `delivery.yml` must exist (E0-CI-01) |
| Protocol Zero script       | Complete | `tools/protocol-zero.sh` exists and is executable      |

---

## Implementation Stories

| Order | Story ID | Story Title                      | Points |
| ----- | -------- | -------------------------------- | ------ |
| 1     | S-GOV-01 | CLI-Driven Repository Bootstrap  | 1      |
| 2     | S-GOV-02 | Identity & Ownership Governance  | 1      |
| 3     | S-GOV-03 | Branch Protection via Rulesets   | 3      |
| 4     | S-GOV-04 | Dependabot Grouping & Auto-Merge | 2      |
| 5     | S-GOV-05 | Governance Audit Workflow        | 2      |

**Total Story Points:** 9

---

## Story Details

### S-GOV-01: CLI-Driven Repository Bootstrap

**Description:**
Use `gh repo edit` to provision the repository with "High Signal" settings. Explicitly disable Wikis and Projects to reduce noise. Enforce **Squash Merging** as the _only_ allowed merge strategy to guarantee a linear, atomic commit history. Enable `delete_branch_on_merge` to prevent stale branch pollution.

**Implementation Notes:**

- Target visibility: **Private** (or Public if open-source intent confirmed)
- Issues: **Enabled** (no external issue tracker in use)
- Use `gh api` for settings not exposed by `gh repo edit`
- Validate all settings via `gh repo view --json`

**Acceptance Criteria:**

| #   | Criterion                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Repository visibility matches documented target (private or public)                                                                                                         |
| 2   | Wiki feature is disabled (`hasWikiEnabled: false`)                                                                                                                          |
| 3   | Projects feature is disabled (`hasProjectsEnabled: false`)                                                                                                                  |
| 4   | Issues feature is enabled (`hasIssuesEnabled: true`)                                                                                                                        |
| 5   | "Allow Squash Merging" is ON (`squashMergeAllowed: true`)                                                                                                                   |
| 6   | "Allow Merge Commit" is OFF (`mergeCommitAllowed: false`)                                                                                                                   |
| 7   | "Allow Rebase Merging" is OFF (`rebaseMergeAllowed: false`)                                                                                                                 |
| 8   | "Automatically delete head branches" is enabled (`deleteBranchOnMerge: true`)                                                                                               |
| 9   | `gh repo view --json hasWikiEnabled,hasProjectsEnabled,hasIssuesEnabled,squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed,deleteBranchOnMerge` confirms all settings |
| 10  | All configuration commands pass `./tools/protocol-zero.sh`                                                                                                                  |

---

### S-GOV-02: Identity & Ownership Governance

**Description:**
Validate and extend the existing `.github/CODEOWNERS` file for individual owner coverage. Verify the existing `PULL_REQUEST_TEMPLATE.md` meets governance standards. Ensure CODEOWNERS syntax is valid for individual owner (not team-based).

**Implementation Notes:**

- Owner: `@dinesh-git17` (individual, not organization team)
- CODEOWNERS already exists; validate syntax and coverage
- PR Template already exists; verify No-AI attestation checkbox present
- No new files expected; validation and minor updates only

**Acceptance Criteria:**

| #   | Criterion                                                                  |
| --- | -------------------------------------------------------------------------- |
| 1   | `.github/CODEOWNERS` file exists with valid syntax (no GitHub UI warnings) |
| 2   | Root `*` ownership is assigned to `@dinesh-git17`                          |
| 3   | `/apps/web/` ownership is assigned to `@dinesh-git17`                      |
| 4   | `/tools/` ownership is assigned to `@dinesh-git17`                         |
| 5   | PR template includes No-AI attestation checkbox                            |
| 6   | PR template renders correctly when opening new PRs                         |
| 7   | Ruleset (S-GOV-03) configured to require CODEOWNER approval                |

---

### S-GOV-03: Branch Protection via Rulesets

**Description:**
Implement a **Repository Ruleset** targeting the default branch (`main`) using `gh api` payload. Replace legacy branch protection documentation with Ruleset configuration. Configure bypass list for Repository Admins only.

**Implementation Notes:**

- **Delete** `.github/BRANCH_PROTECTION.md` (legacy documentation)
- Create new documentation section in this epic or separate Ruleset doc
- Required status checks reference jobs from `quality.yml` and `delivery.yml`:
  - `Lint` (from quality.yml)
  - `Format` (from quality.yml)
  - `Type Check` (from quality.yml)
  - `Protocol Zero` (from quality.yml)
  - `Test` (from delivery.yml)
  - `Build` (from delivery.yml)
  - `Docker Build` (from delivery.yml)
- Bypass list: Repository Admins only (role-based, not team-based)

**Ruleset Configuration:**

```json
{
  "name": "Production Governance",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "require_code_owner_review": true,
        "dismiss_stale_reviews_on_push": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "Lint" },
          { "context": "Format" },
          { "context": "Type Check" },
          { "context": "Protocol Zero" },
          { "context": "Test" },
          { "context": "Build" },
          { "context": "Docker Build" }
        ]
      }
    },
    { "type": "non_fast_forward" }
  ],
  "bypass_actors": [
    { "actor_type": "RepositoryRole", "actor_id": 5, "bypass_mode": "always" }
  ]
}
```

**Acceptance Criteria:**

| #   | Criterion                                                                   |
| --- | --------------------------------------------------------------------------- |
| 1   | Ruleset "Production Governance" is active on `main` branch                  |
| 2   | Direct pushes to `main` are blocked for non-bypass actors                   |
| 3   | Merging is blocked until all 7 required status checks pass                  |
| 4   | Merging is blocked without CODEOWNER approval                               |
| 5   | Repository Admins can bypass rules for emergency merges                     |
| 6   | Force pushes to `main` are blocked (non_fast_forward rule)                  |
| 7   | `.github/BRANCH_PROTECTION.md` is deleted                                   |
| 8   | Ruleset configuration documented in this epic                               |
| 9   | Bypass usage does NOT exempt Protocol Zero CI check (check always required) |
| 10  | `gh api /repos/{owner}/{repo}/rulesets` confirms ruleset exists             |

**Bypass Usage Protocol:**

Bypass capability is for emergency use only. Even when bypassing:

- Local `./tools/protocol-zero.sh` MUST pass before push
- Bypass event is logged in GitHub audit trail
- Post-incident review required for all bypass merges

---

### S-GOV-04: Dependabot Grouping & Auto-Merge

**Description:**
Extend existing `.github/dependabot.yml` with additional groups. Configure repository to allow auto-merge for Dependabot PRs on minor/patch versions **if and only if** CI passes. Major version updates require human review.

**Implementation Notes:**

- Existing `dependabot.yml` has `core-frameworks` group
- Add groups for: `linting-tools`, `typescript-types`, `build-tools`
- Auto-merge implementation: GitHub Action workflow triggered on Dependabot PRs
- Major versions: Labeled for manual review, NOT auto-merged
- npm ecosystem only (pip deferred to backend epic)

**Dependabot Groups:**

| Group            | Patterns                                                         |
| ---------------- | ---------------------------------------------------------------- |
| core-frameworks  | `next`, `react`, `react-dom`, `@types/react`, `@types/react-dom` |
| linting-tools    | `eslint*`, `@eslint/*`, `prettier*`, `@prettier/*`               |
| typescript-types | `@types/*` (excluding react types in core-frameworks)            |
| build-tools      | `turbo*`, `@turbo/*`, `postcss*`, `autoprefixer*`                |

**Auto-Merge Workflow Logic:**

```
IF dependabot PR
  AND update_type IN (minor, patch)
  AND all CI checks pass
THEN enable auto-merge (squash)
ELSE require manual review
```

**Acceptance Criteria:**

| #   | Criterion                                                                     |
| --- | ----------------------------------------------------------------------------- |
| 1   | `dependabot.yml` defines 4+ groups for npm ecosystem                          |
| 2   | `open-pull-requests-limit` is set to 5                                        |
| 3   | GitHub "Allow Auto-Merge" setting is enabled on the repo                      |
| 4   | Workflow exists to enable auto-merge on minor/patch Dependabot PRs            |
| 5   | Workflow uses `dependabot/fetch-metadata` to detect update type               |
| 6   | Major version updates are NOT auto-merged (labeled for review)                |
| 7   | Auto-merged PRs still require all CI checks to pass (including Protocol Zero) |
| 8   | No pip ecosystem configuration (deferred to Phase 2)                          |
| 9   | All Dependabot PRs pass Protocol Zero before merge                            |

---

### S-GOV-05: Governance Audit Workflow

**Description:**
Create a scheduled GitHub Action workflow that validates repository settings match documented requirements. Alert on configuration drift to prevent governance decay.

**Implementation Notes:**

- Schedule: Weekly (cron)
- Checks: Ruleset exists, merge settings correct, branch protection active
- Output: GitHub Issue created on drift detection
- Manual trigger: `workflow_dispatch` for on-demand audit

**Acceptance Criteria:**

| #   | Criterion                                                               |
| --- | ----------------------------------------------------------------------- |
| 1   | `.github/workflows/governance-audit.yml` exists                         |
| 2   | Workflow runs on weekly schedule and manual dispatch                    |
| 3   | Audit checks: squash merge only, delete branch on merge, ruleset active |
| 4   | Drift detection creates GitHub Issue with details                       |
| 5   | Workflow passes `./tools/protocol-zero.sh`                              |
| 6   | No false positives on correctly configured repository                   |

---

## Dependencies & Prerequisites

| Dependency               | Status   | Notes                                             |
| ------------------------ | -------- | ------------------------------------------------- |
| E0-CI-01 Complete        | Required | CI workflows must exist for Ruleset status checks |
| `gh` CLI authenticated   | Required | `repo` and `admin:repo_hook` scopes               |
| Protocol Zero script     | Complete | `tools/protocol-zero.sh` exists                   |
| CODEOWNERS exists        | Complete | `.github/CODEOWNERS` deployed                     |
| PR Template exists       | Complete | `.github/pull_request_template.md` deployed       |
| Dependabot config exists | Partial  | `.github/dependabot.yml` needs group extension    |

---

## Risks & Mitigations

| Risk                                             | Likelihood | Impact | Mitigation                                               |
| ------------------------------------------------ | ---------- | ------ | -------------------------------------------------------- |
| Admin bypass abused for non-emergencies          | Low        | High   | Audit trail review; post-incident documentation required |
| Dependabot auto-merge introduces breaking change | Low        | Medium | CI must pass; major versions excluded from auto-merge    |
| Ruleset API changes break automation             | Low        | Medium | Pin to stable API version; monitor GitHub changelog      |
| Configuration drift undetected                   | Medium     | Medium | S-GOV-05 weekly audit workflow                           |
| `gh` CLI scope insufficient                      | Low        | High   | Verify scopes before execution; document requirements    |

---

## Definition of Done

- [ ] All stories pass their Acceptance Criteria
- [ ] `gh repo view --json` confirms repository settings
- [ ] Ruleset "Production Governance" is active and validated
- [ ] `.github/BRANCH_PROTECTION.md` is deleted
- [ ] Dependabot auto-merge workflow deployed and tested
- [ ] Governance audit workflow deployed
- [ ] All created files pass `./tools/protocol-zero.sh`
- [ ] No AI attribution in any committed artifact

---

## Changelog

| Date       | Change                                                                   | Author                |
| ---------- | ------------------------------------------------------------------------ | --------------------- |
| 2026-01-15 | Initial epic draft                                                       | Project Definition    |
| 2026-01-15 | Gap analysis complete; 19 gaps identified                                | Staff Engineer Review |
| 2026-01-15 | Resolved: Individual repo (not Org), Admin bypass, Deprecate legacy docs | Gap Resolution        |
| 2026-01-15 | Resolved: Minor/patch auto-merge, major requires review                  | Gap Resolution        |
| 2026-01-15 | Added S-GOV-05: Governance Audit Workflow                                | Gap Resolution        |
| 2026-01-15 | Fixed workflow references (quality.yml/delivery.yml, not verify.yml)     | Gap Resolution        |
| 2026-01-15 | Added explicit Protocol Zero compliance requirements to all stories      | Gap Resolution        |
