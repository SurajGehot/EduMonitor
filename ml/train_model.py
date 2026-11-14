
import pandas as pd
import joblib

from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    balanced_accuracy_score,
    average_precision_score,
    confusion_matrix
)

df = pd.read_excel("datasets/raw/Students_Performance_data_set.xlsx")

for col in df.select_dtypes(include=["object", "str"]).columns:
    df[col] = df[col].astype("string").str.strip()

df["Average attendance on class"] = pd.to_numeric(
    df["Average attendance on class"], errors="coerce"
)

df["What is your current CGPA?"] = pd.to_numeric(
    df["What is your current CGPA?"], errors="coerce"
)

df = df.drop_duplicates()

constant_cols = [
    col for col in df.columns
    if df[col].nunique(dropna=False) <= 1
]

df = df.drop(columns=constant_cols)

df["Academic_Risk"] = (
    df["What is your current CGPA?"] < 2.5
).astype(int)

numeric_features = [
    "What was your previous SGPA?",
    "Current Semester",
    "How many hour do you study daily?",
    "How many times do you seat for study in a day?",
    "How many hour do you spent daily in social media?",
    "Average attendance on class",
    "How many hour do you spent daily on your skill development?",
    "How many Credit did you have completed?"
]

categorical_features = [
    "Do you attend in teacher consultancy for any kind of academical problems?",
    "Are you engaged with any co-curriculum activities?",
    "What is your preferable learning mode?",
    "Status of your English language proficiency"
]

feature_cols = numeric_features + categorical_features

X = df[feature_cols].copy()
y = df["Academic_Risk"]

for col in numeric_features:
    X[col] = pd.to_numeric(X[col], errors="coerce")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("numeric", numeric_pipeline, numeric_features),
    ("categorical", categorical_pipeline, categorical_features)
])

model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(
        class_weight="balanced",
        max_iter=2000,
        random_state=42
    ))
])

model.fit(X_train, y_train)

threshold = 0.75

probabilities = model.predict_proba(X_test)[:, 1]
predictions = (probabilities >= threshold).astype(int)

print("\n========== FINAL MODEL EVALUATION ==========")
print("Selected Model: Logistic Regression")
print("Decision Threshold:", threshold)
print("Precision:", round(precision_score(y_test, predictions, zero_division=0), 4))
print("Recall:", round(recall_score(y_test, predictions, zero_division=0), 4))
print("F1 Score:", round(f1_score(y_test, predictions, zero_division=0), 4))
print("Balanced Accuracy:", round(balanced_accuracy_score(y_test, predictions), 4))
print("PR-AUC:", round(average_precision_score(y_test, probabilities), 4))
print("Confusion Matrix:")
print(confusion_matrix(y_test, predictions))

artifact = {
    "model": model,
    "threshold": threshold,
    "features": feature_cols,
    "numeric_features": numeric_features,
    "categorical_features": categorical_features,
    "target": "Academic_Risk",
    "target_definition": "Current CGPA < 2.5",
    "model_name": "Logistic Regression"
}

model_dir = Path("models")
model_dir.mkdir(parents=True, exist_ok=True)

model_path = model_dir / "academic_risk_pipeline.joblib"

joblib.dump(artifact, model_path)

print("\nModel saved successfully!")
print("Location:", model_path)
