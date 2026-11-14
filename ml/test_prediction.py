
import joblib
import pandas as pd

artifact = joblib.load("models/academic_risk_pipeline.joblib")

model = artifact["model"]
threshold = artifact["threshold"]
features = artifact["features"]

student = {
    "What was your previous SGPA?": 2.2,
    "Current Semester": 4,
    "How many hour do you study daily?": 1,
    "How many times do you seat for study in a day?": 1,
    "How many hour do you spent daily in social media?": 5,
    "Average attendance on class": 55,
    "Do you attend in teacher consultancy for any kind of academical problems?": "No",
    "How many hour do you spent daily on your skill development?": 0,
    "Are you engaged with any co-curriculum activities?": "No",
    "How many Credit did you have completed?": 40,
    "What is your preferable learning mode?": "Offline",
    "Status of your English language proficiency": "Intermediate"
}

student_df = pd.DataFrame([student], columns=features)

probability = model.predict_proba(student_df)[0][1]
prediction = int(probability >= threshold)

print("\n========== STUDENT RISK ASSESSMENT ==========")
print("Risk Probability:", round(probability * 100, 2), "%")
print("Decision Threshold:", threshold)
print("Prediction:", "AT RISK" if prediction == 1 else "NOT AT RISK")
