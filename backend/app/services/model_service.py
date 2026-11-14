
from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[3]

MODEL_PATH = BASE_DIR / "models" / "academic_risk_pipeline.joblib"


if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Trained model not found at: {MODEL_PATH}"
    )


artifact = joblib.load(MODEL_PATH)

model = artifact["model"]
THRESHOLD = float(artifact["threshold"])
FEATURES = artifact["features"]


FEATURE_MAPPING = {
    "previous_sgpa": "What was your previous SGPA?",
    "current_semester": "Current Semester",
    "daily_study_hours": "How many hour do you study daily?",
    "study_sessions_per_day": "How many times do you seat for study in a day?",
    "daily_social_media_hours": "How many hour do you spent daily in social media?",
    "attendance": "Average attendance on class",
    "daily_skill_development_hours": "How many hour do you spent daily on your skill development?",
    "completed_credits": "How many Credit did you have completed?",
    "teacher_consultancy": "Do you attend in teacher consultancy for any kind of academical problems?",
    "cocurricular_activities": "Are you engaged with any co-curriculum activities?",
    "learning_mode": "What is your preferable learning mode?",
    "english_proficiency": "Status of your English language proficiency"
}


def predict_risk(input_data: dict) -> dict:
    """
    Predict academic risk using the saved preprocessing
    and Logistic Regression pipeline.

    risk_probability is returned as a decimal between 0 and 1.
    """

    missing_features = [
        key for key in FEATURE_MAPPING
        if key not in input_data
    ]

    if missing_features:
        raise ValueError(
            f"Missing input features: {missing_features}"
        )

    mapped_data = {
        dataset_column: input_data[api_column]
        for api_column, dataset_column in FEATURE_MAPPING.items()
    }

    # Preserve the exact feature names expected by the pipeline.
    input_df = pd.DataFrame(
        [mapped_data],
        columns=FEATURES
    )

    probabilities = model.predict_proba(input_df)[0]

    class_index = list(model.classes_).index(1)
    risk_probability = float(probabilities[class_index])

    prediction = (
        "At Risk"
        if risk_probability >= THRESHOLD
        else "Not at Risk"
    )

    return {
        "risk_probability": risk_probability,
        "decision_threshold": THRESHOLD,
        "prediction": prediction
    }
