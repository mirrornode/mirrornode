# Weekly Canon Audit

**Status:** Operational  
**Last verified:** 2026-08-14 UTC  
**Repository:** `mirrornode/mirrornode`  
**Workflow:** `.github/workflows/weekly-audit.yml`

## Purpose

The Weekly Canon Audit turns MIRRORNODE's declared governance state into reviewable repository evidence. It validates the Canon structure, runs the declared-state audit, records a bounded status snapshot, and publishes the result through the repository's protected pull-request path.

The workflow does not bypass governance. It prepares evidence for review; an operator still decides whether that evidence enters `main`.

## Operating path

1. Check out the current `main` branch with full history.
2. Validate the required Canon index, audit script, charter directory, and contract directory.
3. Run `canon/scripts/audit.sh` against the repository.
4. Generate a dated status record and Markdown snapshot under `vault/weekly/`.
5. Stage the snapshot and generated dossier on a unique automation branch.
6. Push that branch and open a pull request into protected `main`.
7. Dispatch Core CI and Canon Gate for the audit branch.
8. Leave merge, rejection, or further review to the operator.

The workflow runs every Monday at 03:33 UTC and can also be dispatched manually.

## Evidence semantics

Each status record identifies two distinct evidence boundaries:

- `base_commit` is the checked-out `main` revision from which the audit ran.
- `counts_scope=generated_audit_tree_pending_review` means the reported counts include the newly generated audit material on the review branch, before merge.

This distinction matters because a generated dossier changes the tree after checkout. The counts therefore describe the proposed audit tree, not the unchanged base commit by itself.

## Trust boundary

- `main` remains protected and is never pushed to directly by the workflow.
- Audit evidence enters the repository through a pull request.
- Normal required checks and review policy remain in force.
- Automation branches are unique per run and attempt.
- Concurrent weekly audits are serialized rather than cancelled mid-publication.
- The workflow may create a pull request, but it does not approve or merge its own evidence.
- A clean workflow run proves successful generation and publication; it does not replace operator disposition.

## Hardening record

### [PR #18](https://github.com/mirrornode/mirrornode/pull/18) — workflow correctness

Corrected the stale contract reference, recursive dossier handling, concurrency behavior, and explicit `main` checkout used by the weekly audit.

### Production run #29 — protected-branch signal

The first production verification correctly reached publication but failed with GitHub `GH006`: protected `main` required changes through a pull request and expected the `core-ci` status check. This was treated as a valid governance signal, not a reason to weaken branch protection.

### [PR #19](https://github.com/mirrornode/mirrornode/pull/19) — protected publication path

Reworked publication so the workflow creates a unique audit branch and pull request. Added manual-dispatch support to Core CI and Canon Gate so the audit branch can receive the repository's required checks.

### [Production run #30](https://github.com/mirrornode/mirrornode/actions/runs/31771476387) and [PR #20](https://github.com/mirrornode/mirrornode/pull/20) — first complete evidence cycle

Run `31771476387` completed successfully and created the first reviewable weekly audit evidence pull request. Core CI and Canon Gate passed after workflow approval. Codex review identified one evidence-integrity ambiguity: the status file labeled the checked-out revision as `commit` even though its counts included the newly generated dossier.

PR #20 corrected that individual evidence packet before merge. It entered `main` as commit `573c0cab1d191864491cf74c182856b5a0d78a1f`.

### [PR #21](https://github.com/mirrornode/mirrornode/pull/21) — permanent evidence-scope correction

Updated the generator to emit `base_commit` and `counts_scope=generated_audit_tree_pending_review` in every future status record and snapshot. Core CI and Canon Gate passed, and Codex reported no major issues on reviewed commit `f75248986a`.

The permanent correction entered `main` as commit `68d677e49624204e569a2aec39f0574da4cb8e84`.

## Operator review procedure

For each generated weekly audit pull request:

1. Confirm the source workflow run completed successfully.
2. Confirm Core CI and Canon Gate passed on the pull request's current head commit.
3. Review the generated dossier, status record, and snapshot for unexpected drift.
4. Confirm `base_commit` identifies the expected starting revision.
5. Interpret file counts using the declared `counts_scope`.
6. Check for unresolved requested changes or review threads.
7. Merge only when the evidence is coherent; otherwise request correction or close the pull request.

Do not rerun, approve, or merge solely to clear a red signal. First determine whether the signal is an infrastructure fault, a permissions boundary, or genuine Canon drift.

## Current result

The weekly audit now performs its stated function end to end while preserving protected-branch governance. It produces reviewable, correctly scoped evidence, passes the repository's required checks, and leaves final disposition with the operator.
