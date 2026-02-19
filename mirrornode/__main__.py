import argparse

def main() -> int:
    p = argparse.ArgumentParser(prog="mirrornode")
    sub = p.add_subparsers(dest="cmd", required=True)

    sweep = sub.add_parser("sweep", help="Run Osiris system sweep and write artifacts")
    sweep.add_argument("--out", default="artifacts")
    sweep.add_argument("--oracle", choices=["off", "auto", "on"], default="off")
    sweep.add_argument("--ray", choices=["off", "validate", "local"], default="validate")
    sweep.add_argument("--fail-fast", action="store_true")

    args = p.parse_args()

    if args.cmd == "sweep":
        from mirrornode.sweep import run_sweep
        return run_sweep(args)

    return 2

if __name__ == "__main__":
    raise SystemExit(main())
