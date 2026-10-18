import sqlite3
from backend.database.db import get_db

def run_migrations():
    """
    Safely adds new tables and columns to the CareBridge AI database
    without deleting existing data. Idempotent.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Add missing columns to patient_profiles table
        cursor.execute("PRAGMA table_info(patient_profiles)")
        existing_cols = {row['name'] if isinstance(row, sqlite3.Row) else row[1] for row in cursor.fetchall()}

        new_columns = [
            ("gender", "TEXT"),
            ("mobile", "TEXT"),
            ("date_of_birth", "TEXT"),
            ("is_demo", "INTEGER DEFAULT 0")
        ]

        for col_name, col_type in new_columns:
            if col_name not in existing_cols:
                try:
                    cursor.execute(f"ALTER TABLE patient_profiles ADD COLUMN {col_name} {col_type}")
                    print(f"Migration: Added column '{col_name}' to patient_profiles")
                except sqlite3.OperationalError as e:
                    print(f"Migration note on column '{col_name}':", e)

        # 2. Create caregiver_alerts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS caregiver_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL REFERENCES users(id),
                caregiver_id INTEGER NOT NULL REFERENCES users(id),
                schedule_id INTEGER REFERENCES medicine_schedules(id),
                alert_type TEXT NOT NULL DEFAULT 'unconfirmed_dose',
                message_en TEXT,
                message_te TEXT,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending','seen','dismissed')),
                grace_minutes INTEGER DEFAULT 15,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 3. Create push_subscriptions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                endpoint TEXT NOT NULL,
                keys_json TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 4. Create notification_preferences table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notification_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                alert_sound INTEGER DEFAULT 1,
                push_notifications INTEGER DEFAULT 1,
                grace_period_minutes INTEGER DEFAULT 15,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 5. Update existing demo patient profiles to set is_demo=1
        try:
            cursor.execute("""
                UPDATE patient_profiles
                SET is_demo = 1
                WHERE user_id IN (
                    SELECT id FROM users
                    WHERE role = 'patient'
                      AND (email LIKE '%demo%' OR username IN ('lakshmi', 'ramana', 'sunitha'))
                )
            """)
            print(f"Migration: Updated demo patient profiles (affected rows: {cursor.rowcount})")
        except Exception as e:
            print("Migration note on setting is_demo=1:", e)

    print("All migrations executed successfully.")

if __name__ == '__main__':
    run_migrations()
