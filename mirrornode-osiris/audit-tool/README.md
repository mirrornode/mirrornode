# OSIRIS Audit Tool v0

This directory contains an initial skeleton implementation of the **OSIRIS Audit Tool v0**. The goal of this tool is to provide deterministic, explainable findings about a codebase or content repository without making any modifications. It is designed to be extended incrementally in future versions.

The CLI entry point is `osiris`, with one primary subcommand:

```bash
osiris audit <target> [--dry-run] [--summary] [--json] [--out FILE] [--strict] [--config FILE]
```

See the module `osiris/cli.py` for argument parsing and basic execution flow. See `osiris/audit.py` for the `Audit` class and the `AuditResult` data structure.

### Implementation notes

- The current implementation is intentionally minimal: it checks for the presence of a `README` file in the target directory and constructs a stub `AuditResult` object. You can extend the `Audit.run()` method with additional structure, documentation and invariant checks.
- `AuditResult.to_json()` serializes audit data to a JSON string matching the schema defined in the project specification. `AuditResult.to_summary()` returns a human‑readable summary.
- The CLI defaults to producing a human-readable summary when no explicit output format is requested.

### Running the tool

From within this directory, you can run the tool against any directory on your system:

```bash
python -m osiris.cli audit ./path/to/repo --summary
```

or to generate JSON output and write it to a file:

```bash
python -m osiris.cli audit ./path/to/repo --json --out result.json
```

Note: Version 0 is a placeholder for further development; the audit logic is not complete.