from datetime import datetime, timezone, date

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    Integer,
    String,
    ForeignKey,
    JSON
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base



class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    student_id: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)

    current_semester: Mapped[int] = mapped_column(Integer, nullable=False)
    previous_sgpa: Mapped[float] = mapped_column(Float, nullable=False)
    attendance: Mapped[float] = mapped_column(Float, nullable=False)

    # Academic and engagement features
    daily_study_hours: Mapped[float] = mapped_column(Float, nullable=False)
    study_sessions_per_day: Mapped[int] = mapped_column(Integer, nullable=False)
    preferred_learning_mode: Mapped[str] = mapped_column(String(50), nullable=False)
    daily_social_media_hours: Mapped[float] = mapped_column(Float, nullable=False)
    english_proficiency: Mapped[str] = mapped_column(String(50), nullable=False)
    teacher_consultancy: Mapped[str] = mapped_column(String(50), nullable=False)
    daily_skill_development_hours: Mapped[float] = mapped_column(Float, nullable=False)
    cocurricular_activities: Mapped[str] = mapped_column(String(50), nullable=False)
    completed_credits: Mapped[int] = mapped_column(Integer, nullable=False)

    # Research dataset outcome
    current_cgpa: Mapped[float] = mapped_column(Float, nullable=False)

    # Identifies demonstration versus actual records
    data_source: Mapped[str] = mapped_column(
        String(30), default="demonstration", nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )



class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    student_record_id: Mapped[int | None] = mapped_column(
        ForeignKey("students.id"),
        nullable=True,
        index=True
    )

    input_features: Mapped[dict] = mapped_column(
        JSON,
        nullable=False
    )

    risk_probability: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    decision_threshold: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    prediction: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class Intervention(Base):
    __tablename__ = "interventions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    student_record_id: Mapped[int | None] = mapped_column(
        ForeignKey("students.id"),
        nullable=True,
        index=True
    )

    student_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )

    student_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    issue: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    action: Mapped[str] = mapped_column(
        String(1000),
        nullable=False
    )

    assigned_to: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Pending",
        nullable=False,
        index=True
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )