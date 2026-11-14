
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.database import SessionLocal
from app.models import Student, Prediction
from app.services.model_service import predict_risk


def assess_all_students():
    db = SessionLocal()

    try:
        students = (
            db.query(Student)
            .filter(Student.data_source == "demonstration")
            .order_by(Student.id)
            .all()
        )

        existing_prediction_ids = {
            record[0]
            for record in (
                db.query(Prediction.student_record_id)
                .filter(Prediction.student_record_id.isnot(None))
                .all()
            )
        }

        new_predictions = []
        skipped = 0
        at_risk = 0
        not_at_risk = 0

        for student in students:

            if student.id in existing_prediction_ids:
                skipped += 1
                continue

            input_data = {
                "previous_sgpa": student.previous_sgpa,
                "current_semester": student.current_semester,
                "daily_study_hours": student.daily_study_hours,
                "study_sessions_per_day": student.study_sessions_per_day,
                "daily_social_media_hours": student.daily_social_media_hours,
                "attendance": student.attendance,
                "teacher_consultancy": student.teacher_consultancy,
                "daily_skill_development_hours": student.daily_skill_development_hours,
                "cocurricular_activities": student.cocurricular_activities,
                "completed_credits": student.completed_credits,
                "learning_mode": student.preferred_learning_mode,
                "english_proficiency": student.english_proficiency
            }

            result = predict_risk(input_data)

            prediction_record = Prediction(
                student_record_id=student.id,
                input_features=input_data,
                risk_probability=result["risk_probability"],
                decision_threshold=result["decision_threshold"],
                prediction=result["prediction"]
            )

            new_predictions.append(prediction_record)

            if result["prediction"] == "At Risk":
                at_risk += 1
            else:
                not_at_risk += 1

        if new_predictions:
            db.add_all(new_predictions)
            db.commit()

        print("\n========== BATCH RISK ASSESSMENT ==========")
        print(f"Demonstration students found: {len(students)}")
        print(f"New predictions generated: {len(new_predictions)}")
        print(f"Existing predictions skipped: {skipped}")
        print(f"At Risk: {at_risk}")
        print(f"Not at Risk: {not_at_risk}")
        print("===========================================")
        print("Batch assessment completed successfully.")

    except Exception as error:
        db.rollback()
        print(f"\nAssessment failed: {error}")

    finally:
        db.close()


if __name__ == "__main__":
    assess_all_students()
