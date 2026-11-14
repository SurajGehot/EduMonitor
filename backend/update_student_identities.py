
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Student


def update_student_identities():
    db: Session = SessionLocal()

    try:
        students = (
            db.query(Student)
            .filter(Student.data_source == "demonstration")
            .order_by(Student.id.asc())
            .all()
        )

        if not students:
            print("No demonstration students found.")
            return

        if len(students) > 99999:
            raise ValueError("The 5-digit sequence limit has been exceeded.")

        updates = []

        for sequence, student in enumerate(students, start=1):
            semester = student.current_semester

            if semester is None or semester < 1:
                raise ValueError(
                    f"Invalid semester for database student ID {student.id}"
                )

            year_of_study = (semester + 1) // 2
            joining_year_code = 27 - year_of_study

            if not 0 <= joining_year_code <= 99:
                raise ValueError(
                    f"Invalid joining-year code for student ID {student.id}"
                )

            new_student_id = f"1{joining_year_code:02d}{sequence:05d}"
            new_name = f"Research Participant {sequence:05d}"

            updates.append(
                (student, new_student_id, new_name)
            )

        generated_ids = [
            student_id for _, student_id, _ in updates
        ]

        if len(generated_ids) != len(set(generated_ids)):
            raise ValueError("Duplicate student IDs generated.")

        non_demo_ids = {
            row[0]
            for row in (
                db.query(Student.student_id)
                .filter(Student.data_source != "demonstration")
                .all()
            )
        }

        if non_demo_ids.intersection(generated_ids):
            raise ValueError(
                "Generated IDs conflict with existing non-demonstration records."
            )

        print("\n========== MIGRATION PREVIEW ==========")
        print("Records to update:", len(updates))

        for student, new_id, new_name in updates[:5]:
            print(
                f"{student.student_id} -> {new_id} | "
                f"{student.name} -> {new_name}"
            )

        print("\nThis operation will update existing records.")
        print("Prediction history and database record IDs will remain unchanged.")

        confirmation = input(
            "\nType UPDATE to proceed: "
        ).strip()

        if confirmation != "UPDATE":
            print("Migration cancelled. No records were changed.")
            return

        for student, new_id, new_name in updates:
            student.student_id = new_id
            student.name = new_name

        db.commit()

        print("\n========== MIGRATION RESULTS ==========")
        print("Updated records:", len(updates))
        print("Migration completed successfully.")

        print("\nUpdated sample records:")

        for student, _, _ in updates[:5]:
            print(
                student.student_id,
                "|",
                student.name,
                "| Semester:",
                student.current_semester
            )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    update_student_identities()
