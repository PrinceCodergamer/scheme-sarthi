import sqlite3
import os
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scheme_sarthi.db")


def run_migration():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute("PRAGMA table_info(schemes)")
    columns = [row[1] for row in cursor.fetchall()]

    if "sources" not in columns:
        conn.execute("ALTER TABLE schemes ADD COLUMN sources TEXT DEFAULT '{}'")
        conn.execute("UPDATE schemes SET sources = '{}' WHERE sources IS NULL")
        print("Migration: added 'sources' column to schemes table.")
    else:
        print("Migration: 'sources' column already exists. Skipping.")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    run_migration()
    print("Migration complete.")
