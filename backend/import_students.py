
from pathlib import Path
import sys

import pandas as pd
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.database import SessionLocal
from app.models import Student


DATASET_PATH = BASE_DIR / "datasets" / "raw" / "Students_Performance_data_set.xlsx"

FEATURE_COLUMNS = {
    "previous_sgpa": "What was your previous SGPA?",
    "current_semester": "Current Semester",
    "daily_study_hours": "How many hour do you study daily?",
    "study_sessions_per_day": "How many times do you seat for study in a day?",
    "preferred_learning_mode": "What is your preferable learning mode?",
    "daily_social_media_hours": "How many hour do you spent daily in social media?",
    "english_proficiency": "Status of your English language proficiency",
    "attendance": "Average attendance on class",
    "teacher_consultancy": "Do you attend in teacher consultancy for any kind of academical problems?",
    "daily_skill_development_hours": "How many hour do you spent daily on your skill development?",
    "cocurricular_activities": "Are you engaged with any co-curriculum activities?",
    "completed_credits": "How many Credit did you have completed?",
    "current_cgpa": "What is your current CGPA?"
}

NUMERIC_FIELDS = [
    "previous_sgpa",
    "current_semester",
    "daily_study_hours",
    "study_sessions_per_day",
    "daily_social_media_hours",
    "attendance",
    "daily_skill_development_hours",
    "completed_credits",
    "current_cgpa"
]

CATEGORICAL_FIELDS = [
    "preferred_learning_mode",
    "english_proficiency",
    "teacher_consultancy",
    "cocurricular_activities"
]


def clean_dataset():
    df = pd.read_excel(DATASET_PATH)

    for col in df.select_dtypes(include=["object", "str"]).columns:
        df[col] = df[col].astype("string").str.strip()

    for field in NUMERIC_FIELDS:
        source_column = FEATURE_COLUMNS[field]
        df[source_column] = pd.to_numeric(
            df[source_column], errors="coerce"
        )

    df = df.drop_duplicates()

    required_columns = list(FEATURE_COLUMNS.values())
    df = df.dropna(subset=required_columns)

    return df


def import_students():
    df = clean_dataset()

    db: Session = SessionLocal()

    try:
        existing_ids = {
            row[0]
            for row in db.query(Student.student_id).all()
        }

        imported = 0
        skipped = 0

        for index, row in df.iterrows():
            student_id = f"DATASET-{index + 1:04d}"

            if student_id in existing_ids:
                skipped += 1
                continue

            values = {}

            for field, source_column in FEATURE_COLUMNS.items():
                value = row[source_column]

                if field in NUMERIC_FIELDS:
                    value = float(value)

                    if field in {
                        "current_semester",
                        "study_sessions_per_day",
                        "completed_credits"
                    }:
                        value = int(value)
                else:
                    value = str(value)

                values[field] = value

            student = Student(
                student_id=student_id,
                name=f"Demonstration Student {index + 1:04d}",
                data_source="demonstration",
                **values
            )

            db.add(student)
            imported += 1

        db.commit()

        print("\n========== IMPORT RESULTS ==========")
        print("Cleaned dataset records:", len(df))
        print("New records imported:", imported)
        print("Existing records skipped:", skipped)
        print(
            "Total demonstration students:",
            db.query(Student).filter(
                Student.data_source == "demonstration"
            ).count()
        )
        print("Import completed successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    import_students()
