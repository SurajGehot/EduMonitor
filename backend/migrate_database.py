
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATABASE_PATH = BASE_DIR / "data" / "academic_early_warning.db"

columns = {
    "daily_study_hours": "REAL NOT NULL DEFAULT 0",
    "study_sessions_per_day": "INTEGER NOT NULL DEFAULT 0",
    "preferred_learning_mode": "VARCHAR(50) NOT NULL DEFAULT 'Unknown'",
    "daily_social_media_hours": "REAL NOT NULL DEFAULT 0",
    "english_proficiency": "VARCHAR(50) NOT NULL DEFAULT 'Unknown'",
    "teacher_consultancy": "VARCHAR(50) NOT NULL DEFAULT 'Unknown'",
    "daily_skill_development_hours": "REAL NOT NULL DEFAULT 0",
    "cocurricular_activities": "VARCHAR(50) NOT NULL DEFAULT 'Unknown'",
    "completed_credits": "INTEGER NOT NULL DEFAULT 0",
    "current_cgpa": "REAL NOT NULL DEFAULT 0",
    "data_source": "VARCHAR(30) NOT NULL DEFAULT 'actual'"
}

conn = sqlite3.connect(DATABASE_PATH)
cursor = conn.cursor()

existing_columns = {
    row[1] for row in cursor.execute("PRAGMA table_info(students)")
}

for column_name, column_type in columns.items():
    if column_name not in existing_columns:
        cursor.execute(
            f"ALTER TABLE students ADD COLUMN {column_name} {column_type}"
        )
        print(f"Added column: {column_name}")
    else:
        print(f"Already exists: {column_name}")

conn.commit()

updated_columns = cursor.execute(
    "PRAGMA table_info(students)"
).fetchall()

print("\nSTUDENT TABLE MIGRATION: SUCCESS")
print("TOTAL COLUMNS:", len(updated_columns))
print("EXISTING STUDENTS:", cursor.execute(
    "SELECT COUNT(*) FROM students"
).fetchone()[0])

conn.close()
