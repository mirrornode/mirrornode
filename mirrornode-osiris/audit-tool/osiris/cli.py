"""
CLI module for the OSIRIS Audit Tool v0.

This module defines the `osiris` command entry point and handles argument
parsing for the `audit` subcommand. The CLI is intentionally minimal for
version 0: it wires command‑line arguments to the underlying `Audit` class
and controls output formatting.

Future versions may support additional subcommands and more sophisticated
configuration handling.
"""
import argparse
import sys

from .audit import Audit, AuditResult


def _build_parser() -> argparse.ArgumentParser:
    """Construct and return the top-level argument parser."""
    parser = argparse.ArgumentParser(
        prog="osiris",
        description="OSIRIS Audit Tool v0: deterministic, read‑only repository inspection",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # `audit` subcommand
    audit_parser = subparsers.add_parser(
        "audit",
        help="Audit a target directory or repository",
        description=(
            "Inspect the given TARGET directory and produce an audit report."
        ),
    )
    audit_parser.add_argument(
        "target",
        help="Path to the repository or directory to audit",
    )
    audit_parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Run without side effects (default and currently only mode)",
    )
    audit_parser.add_argument(
        "--summary",
        action="store_true",
        help="Output human‑readable summary instead of JSON",
    )
    audit_parser.add_argument(
        "--json",
        action="store_true",
        help="Output full JSON report instead of summary",
    )
    audit_parser.add_argument(
        "--out",
        metavar="FILE",
        help="Write JSON output to the specified file",
    )
    audit_parser.add_argument(
        "--strict",
        action="store_true",
        help="Elevate warnings to failures (affects exit code)",
    )
    audit_parser.add_argument(
        "--config",
        metavar="FILE",
        help="Path to a configuration file defining additional invariants",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """Main entry point for the osiris CLI.

    Args:
        argv: optional list of arguments (defaults to sys.argv[1:]).

    Returns:
        Exit status code.
    """
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "audit":
        audit = Audit(target=args.target, config_path=args.config)
        # Run the audit. Strict mode influences exit code but not report structure.
        result: AuditResult = audit.run(strict=args.strict)

        # Determine output format
        if args.json:
            json_report = result.to_json()
            if args.out:
                try:
                    with open(args.out, "w", encoding="utf-8") as f:
                        f.write(json_report)
                except OSError as exc:
                    parser.error(f"Failed to write output to {args.out}: {exc}")
            else:
                print(json_report)
        else:
            # Default to summary if --summary or nothing else specified
            summary_text = result.to_summary()
            print(summary_text)

        # Exit code according to strict mode semantics
        status = result.exit_code(strict=args.strict)
        return status

    # Should never reach here due to required subcommand
    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())