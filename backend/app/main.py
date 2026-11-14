
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import date
from typing import Literal
from sqlalchemy import func
from app.database import get_db
from app.models import Student, Prediction, Intervention
from app.services.model_service import predict_risk




app = FastAPI(
    title="LPU Student Academic Early-Warning System",
    description="Backend API for academic risk assessment and intervention management.",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class PredictionInput(BaseModel):
    student_record_id: int | None = None

    previous_sgpa: float = Field(ge=0, le=10)
    current_semester: int = Field(ge=1)
    daily_study_hours: float = Field(ge=0, le=24)
    study_sessions_per_day: int = Field(ge=0)
    daily_social_media_hours: float = Field(ge=0, le=24)
    attendance: float = Field(ge=0, le=100)
    teacher_consultancy: str
    daily_skill_development_hours: float = Field(ge=0, le=24)
    cocurricular_activities: str
    completed_credits: int = Field(ge=0)
    learning_mode: str
    english_proficiency: str

class StudentCreate(BaseModel):
    student_id: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=100)
    current_semester: int = Field(ge=1)
    previous_sgpa: float = Field(ge=0, le=10)
    attendance: float = Field(ge=0, le=100)

class InterventionCreate(BaseModel):
    student_id: str = Field(min_length=1, max_length=50)
    student_name: str = Field(min_length=1, max_length=100)
    issue: str = Field(min_length=1, max_length=500)
    action: str = Field(min_length=1, max_length=1000)
    assigned_to: str = Field(min_length=1, max_length=100)
    status: Literal["Pending", "In Progress", "Resolved"] = "Pending"
    due_date: date | None = None


class InterventionUpdate(BaseModel):
    status: Literal["Pending", "In Progress", "Resolved"] | None = None
    assigned_to: str | None = Field(default=None, max_length=100)
    due_date: date | None = None
    action: str | None = Field(default=None, min_length=1, max_length=1000)

@app.get("/")
def root():
    return {
        "message": "LPU Student Academic Early-Warning System API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "backend": "FastAPI",
        "version": "1.0.0"
    }



@app.get("/api/v1/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):

    # Total student records
    total_students = db.query(Student).count()

    # Find the latest prediction ID for each assessed student
    latest_prediction_ids = (
        db.query(
            Prediction.student_record_id,
            func.max(Prediction.id).label("latest_prediction_id")
        )
        .filter(Prediction.student_record_id.isnot(None))
        .group_by(Prediction.student_record_id)
        .subquery()
    )

    # Retrieve only the latest prediction for each student
    latest_predictions = (
        db.query(Prediction)
        .join(
            latest_prediction_ids,
            Prediction.id == latest_prediction_ids.c.latest_prediction_id
        )
    )

    # Count students by their latest risk classification
    at_risk = latest_predictions.filter(
        Prediction.prediction == "At Risk"
    ).count()

    not_at_risk = latest_predictions.filter(
        Prediction.prediction == "Not at Risk"
    ).count()

    assessed = at_risk + not_at_risk
    not_assessed = total_students - assessed

    # Calculate percentages among assessed students
    at_risk_percentage = (
        round((at_risk / assessed) * 100, 2)
        if assessed > 0 else 0
    )

    not_at_risk_percentage = (
        round((not_at_risk / assessed) * 100, 2)
        if assessed > 0 else 0
    )

    assessment_coverage = (
        round((assessed / total_students) * 100, 2)
        if total_students > 0 else 0
    )

    return {
        "total_students": total_students,
        "assessed": assessed,
        "not_assessed": not_assessed,
        "at_risk": at_risk,
        "not_at_risk": not_at_risk,
        "at_risk_percentage": at_risk_percentage,
        "not_at_risk_percentage": not_at_risk_percentage,
        "assessment_coverage": assessment_coverage
    }



@app.post("/api/v1/students", status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db)):

    existing_student = db.query(Student).filter(
        Student.student_id == data.student_id
    ).first()

    if existing_student:
        raise HTTPException(
            status_code=409,
            detail="Student ID already exists."
        )

    new_student = Student(**data.model_dump())

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return {
        "message": "Student registered successfully.",
        "student": {
            "id": new_student.id,
            "student_id": new_student.student_id,
            "name": new_student.name,
            "current_semester": new_student.current_semester,
            "previous_sgpa": new_student.previous_sgpa,
            "attendance": new_student.attendance,
            "created_at": new_student.created_at
        }
    }




@app.get("/api/v1/students")
def get_students(
    search: str = "",
    semester: int | None = None,
    risk: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Student)

    if search:
        query = query.filter(
            (Student.name.ilike(f"%{search}%")) |
            (Student.student_id.ilike(f"%{search}%"))
        )

    if semester is not None:
        query = query.filter(
            Student.current_semester == semester
        )

    # Identify the latest prediction for each student.
    latest_prediction_ids = (
        db.query(
            Prediction.student_record_id,
            func.max(Prediction.id).label("latest_prediction_id")
        )
        .filter(Prediction.student_record_id.isnot(None))
        .group_by(Prediction.student_record_id)
        .subquery()
    )

    # Apply risk filtering using each student's latest prediction.
    if risk == "At Risk" or risk == "Not at Risk":
        matching_student_ids = (
            db.query(Prediction.student_record_id)
            .join(
                latest_prediction_ids,
                Prediction.id == latest_prediction_ids.c.latest_prediction_id
            )
            .filter(Prediction.prediction == risk)
            .subquery()
        )

        query = query.filter(
            Student.id.in_(
                db.query(matching_student_ids.c.student_record_id)
            )
        )

    elif risk == "Not Assessed":
        assessed_student_ids = (
            db.query(latest_prediction_ids.c.student_record_id)
            .subquery()
        )

        query = query.filter(
            ~Student.id.in_(
                db.query(assessed_student_ids.c.student_record_id)
            )
        )

    total = query.count()

    students = (
        query.order_by(Student.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    student_ids = [student.id for student in students]

    latest_predictions = {}

    if student_ids:
        predictions = (
            db.query(Prediction)
            .filter(
                Prediction.student_record_id.in_(student_ids)
            )
            .order_by(
                Prediction.created_at.desc(),
                Prediction.id.desc()
            )
            .all()
        )

        for prediction in predictions:
            if prediction.student_record_id not in latest_predictions:
                latest_predictions[prediction.student_record_id] = prediction

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "students": [
            {
                "id": student.id,
                "student_id": student.student_id,
                "name": student.name,
                "current_semester": student.current_semester,
                "previous_sgpa": student.previous_sgpa,
                "attendance": student.attendance,
                "risk_status": (
                    latest_predictions[student.id].prediction
                    if student.id in latest_predictions
                    else None
                ),
                "risk_probability": (
                    latest_predictions[student.id].risk_probability
                    if student.id in latest_predictions
                    else None
                ),
                "decision_threshold": (
                    latest_predictions[student.id].decision_threshold
                    if student.id in latest_predictions
                    else None
                ),
                "data_source": student.data_source,
                "created_at": student.created_at
            }
            for student in students
        ]
    }



@app.get("/api/v1/students/{student_record_id}")
def get_student_details(
    student_record_id: int,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.id == student_record_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student record not found."
        )

    # Retrieve the student's latest prediction
    latest_prediction = (
        db.query(Prediction)
        .filter(
            Prediction.student_record_id == student.id
        )
        .order_by(
            Prediction.created_at.desc(),
            Prediction.id.desc()
        )
        .first()
    )

    return {
        "id": student.id,
        "student_id": student.student_id,
        "name": student.name,

        # All 12 assessment features
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
        "english_proficiency": student.english_proficiency,

        # Existing student information
        "current_cgpa": student.current_cgpa,
        "data_source": student.data_source,

        # Latest assessment information
        "risk_status": (
            latest_prediction.prediction
            if latest_prediction else None
        ),
        "risk_probability": (
            latest_prediction.risk_probability
            if latest_prediction else None
        ),
        "decision_threshold": (
            latest_prediction.decision_threshold
            if latest_prediction else None
        )
    }



@app.post("/api/v1/predictions", status_code=201)
def create_prediction(
    data: PredictionInput,
    db: Session = Depends(get_db)
):
    input_data = data.model_dump(exclude={"student_record_id"})

    # Validate optional student association
    student_record_id = data.student_record_id

    if student_record_id is not None:
        student = db.query(Student).filter(
            Student.id == student_record_id
        ).first()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student record not found."
            )

    # Generate model prediction
    result = predict_risk(input_data)

    # Create prediction database record
    new_prediction = Prediction(
        student_record_id=student_record_id,
        input_features=input_data,
        risk_probability=result["risk_probability"],
        decision_threshold=result["decision_threshold"],
        prediction=result["prediction"]
    )

    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    return {
        "prediction_id": new_prediction.id,
        "student_record_id": new_prediction.student_record_id,
        "risk_probability": new_prediction.risk_probability,
        "decision_threshold": new_prediction.decision_threshold,
        "prediction": new_prediction.prediction,
        "created_at": new_prediction.created_at
    }


@app.get("/api/v1/predictions")
def get_predictions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    student_record_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = (
        db.query(Prediction, Student)
        .outerjoin(
            Student,
            Prediction.student_record_id == Student.id
        )
    )

    if student_record_id is not None:
        query = query.filter(
            Prediction.student_record_id == student_record_id
        )

    total = query.count()

    records = (
        query
        .order_by(
            Prediction.created_at.desc(),
            Prediction.id.desc()
        )
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "predictions": [
            {
                "prediction_id": prediction.id,
                "student_record_id": prediction.student_record_id,
                "student_id": (
                    student.student_id if student else None
                ),
                "student_name": (
                    student.name if student else None
                ),
                "risk_probability": prediction.risk_probability,
                "decision_threshold": prediction.decision_threshold,
                "prediction": prediction.prediction,
                "created_at": prediction.created_at
            }
            for prediction, student in records
        ]
    }


@app.post("/api/v1/interventions", status_code=201)
def create_intervention(
    data: InterventionCreate,
    db: Session = Depends(get_db)
):
    # Find the registered student using the supplied student ID
    student = db.query(Student).filter(
        Student.student_id == data.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student ID does not exist in the database."
        )

    new_intervention = Intervention(
        student_record_id=student.id,
        student_id=student.student_id,
        student_name=student.name,
        issue=data.issue,
        action=data.action,
        assigned_to=data.assigned_to,
        status=data.status,
        due_date=data.due_date
    )

    db.add(new_intervention)
    db.commit()
    db.refresh(new_intervention)

    return {
        "message": "Intervention created successfully.",
        "intervention": {
            "id": str(new_intervention.id),
            "student_id": new_intervention.student_id,
            "student_name": new_intervention.student_name,
            "issue": new_intervention.issue,
            "action": new_intervention.action,
            "assigned_to": new_intervention.assigned_to,
            "status": new_intervention.status,
            "due_date": new_intervention.due_date,
            "created_at": new_intervention.created_at
        }
    }


@app.get("/api/v1/interventions")
def get_interventions(
    status: str = Query(default="All"),
    db: Session = Depends(get_db)
):
    query = db.query(Intervention)

    if status != "All":
        if status not in ["Pending", "In Progress", "Resolved"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid intervention status."
            )

        query = query.filter(Intervention.status == status)

    items = query.order_by(
        Intervention.created_at.desc(),
        Intervention.id.desc()
    ).all()

    return {
        "total": len(items),
        "items": [
            {
                "id": str(item.id),
                "student_id": item.student_id,
                "student_name": item.student_name,
                "issue": item.issue,
                "action": item.action,
                "assigned_to": item.assigned_to,
                "status": item.status,
                "due_date": (
                    item.due_date.isoformat()
                    if item.due_date else None
                ),
                "created_at": item.created_at
            }
            for item in items
        ]
    }


@app.patch("/api/v1/interventions/{intervention_id}")
def update_intervention(
    intervention_id: int,
    data: InterventionUpdate,
    db: Session = Depends(get_db)
):
    intervention = db.query(Intervention).filter(
        Intervention.id == intervention_id
    ).first()

    if not intervention:
        raise HTTPException(
            status_code=404,
            detail="Intervention not found."
        )

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(intervention, field, value)

    db.commit()
    db.refresh(intervention)

    return {
        "message": "Intervention updated successfully.",
        "intervention": {
            "id": str(intervention.id),
            "student_id": intervention.student_id,
            "student_name": intervention.student_name,
            "issue": intervention.issue,
            "action": intervention.action,
            "assigned_to": intervention.assigned_to,
            "status": intervention.status,
            "due_date": (
                intervention.due_date.isoformat()
                if intervention.due_date else None
            ),
            "created_at": intervention.created_at
        }
    }



@app.get("/api/v1/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):

    # 1. Total registered student records
    total_students = db.query(func.count(Student.id)).scalar() or 0

    # 2. Find the latest prediction for every registered student
    latest_predictions = (
        db.query(
            Prediction.student_record_id,
            func.max(Prediction.id).label("latest_prediction_id")
        )
        .filter(Prediction.student_record_id.isnot(None))
        .group_by(Prediction.student_record_id)
        .subquery()
    )

    latest_records = (
        db.query(Prediction, Student)
        .join(
            latest_predictions,
            Prediction.id == latest_predictions.c.latest_prediction_id
        )
        .join(Student, Student.id == Prediction.student_record_id)
        .all()
    )

    assessed = len(latest_records)
    not_assessed = max(total_students - assessed, 0)

    at_risk = sum(
        1 for prediction, student in latest_records
        if prediction.prediction == "At Risk"
    )

    not_at_risk = sum(
        1 for prediction, student in latest_records
        if prediction.prediction == "Not at Risk"
    )

    risk_percentage = (
        (at_risk / assessed) * 100 if assessed > 0 else 0
    )

    # 3. Current intervention status counts
    pending = (
        db.query(func.count(Intervention.id))
        .filter(Intervention.status == "Pending")
        .scalar() or 0
    )

    in_progress = (
        db.query(func.count(Intervention.id))
        .filter(Intervention.status == "In Progress")
        .scalar() or 0
    )

    resolved = (
        db.query(func.count(Intervention.id))
        .filter(Intervention.status == "Resolved")
        .scalar() or 0
    )

    # 4. Latest prediction activity, including standalone assessments
    recent_records = (
        db.query(Prediction, Student)
        .outerjoin(
            Student,
            Prediction.student_record_id == Student.id
        )
        .order_by(
            Prediction.created_at.desc(),
            Prediction.id.desc()
        )
        .limit(10)
        .all()
    )

    recent_assessments = []

    for prediction, student in recent_records:
        recent_assessments.append({
            "id": str(prediction.id),
            "student_id": student.student_id if student else "Standalone",
            "student_name": student.name if student else "Standalone Assessment",
            "prediction": prediction.prediction,
            "risk_probability": float(prediction.risk_probability),
            "assessed_at": (
                prediction.created_at.isoformat()
                if prediction.created_at else None
            )
        })

    # 5. Saved model evaluation metrics
    model_metrics = {
        "accuracy": 96.23,
        "precision": 76.47,
        "recall": 72.22,
        "f1_score": 74.29,
        "balanced_accuracy": 85.21,
        "pr_auc": 85.17
    }

    # 6. Return complete analytics response
    return {
        "total_students": total_students,
        "at_risk": at_risk,
        "not_at_risk": not_at_risk,
        "risk_percentage": round(risk_percentage, 2),

        "risk_distribution": [
            {
                "name": "Not at Risk",
                "value": not_at_risk
            },
            {
                "name": "At Risk",
                "value": at_risk
            }
        ],

        "model_metrics": model_metrics,

        "intervention_summary": {
            "pending": pending,
            "in_progress": in_progress,
            "resolved": resolved
        },

        "recent_assessments": recent_assessments
    }
