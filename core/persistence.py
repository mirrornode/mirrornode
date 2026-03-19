from __future__ import annotations
import json
import sqlite3
from pathlib import Path
from typing import Any
from olympus.core.ledger import RunLedger

class SQLiteLedgerStore:
    def __init__(self, db_path: str = "olympus.db") -> None:
        self.path = Path(db_path)
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS runs (
                    run_id TEXT PRIMARY KEY,
                    status TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    payload TEXT
                )
            """)

    def save(self, ledger: RunLedger) -> None:
        with sqlite3.connect(self.path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO runs
                (run_id, status, created_at, updated_at, payload)
                VALUES (?, ?, ?, ?, ?)
            """, (
                ledger.run_id,
                ledger.status.value,
                ledger.started_at.isoformat(),
                ledger.ended_at.isoformat() if ledger.ended_at else ledger.started_at.isoformat(),
                ledger.model_dump_json(),
            ))

    def load(self, run_id: str) -> dict[str, Any] | None:
        with sqlite3.connect(self.path) as conn:
            row = conn.execute(
                "SELECT payload FROM runs WHERE run_id = ?", (run_id,)
            ).fetchone()
            return json.loads(row[0]) if row else None
