
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_predict
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
    confusion_matrix
)


# 1. Load and clean original dataset

df = pd.read_excel(
    "datasets/raw/Students_Performance_data_set.xlsx"
)

for col in df.select_dtypes(include=["object", "str"]).columns:
    df[col] = df[col].astype("string").str.strip()

df["Average attendance on class"] = pd.to_numeric(
    df["Average attendance on class"],
    errors="coerce"
)

health_col = "What are your health issues?"

if health_col in df.columns:
    df[health_col] = df[health_col].replace({
        "no": "No",
        "n": "No",
        "yes": "Yes"
    })

df = df.drop_duplicates()

constant_cols = [
    col for col in df.columns
    if df[col].nunique(dropna=False) <= 1
]

df = df.drop(columns=constant_cols)


# 2. Create target variable

df["Academic_Risk"] = (
    df["What is your current CGPA?"] < 2.5
).astype(int)


# 3. Select features

feature_cols = [
    "What was your previous SGPA?",
    "Current Semester",
    "How many hour do you study daily?",
    "How many times do you seat for study in a day?",
    "How many hour do you spent daily in social media?",
    "Average attendance on class",
    "Do you attend in teacher consultancy for any kind of academical problems?",
    "How many hour do you spent daily on your skill development?",
    "Are you engaged with any co-curriculum activities?",
    "How many Credit did you have completed?",
    "What is your preferable learning mode?",
    "Status of your English language proficiency"
]

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

X = df[feature_cols].copy()
y = df["Academic_Risk"]

for col in numeric_features:
    X[col] = pd.to_numeric(X[col], errors="coerce")


# 4. Reproduce the same stratified training split

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# 5. Build preprocessing pipeline

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


# 6. Combine preprocessing and Logistic Regression

model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(
        class_weight="balanced",
        max_iter=2000,
        random_state=42
    ))
])


# 7. Configure stratified cross-validation

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)


# 8. Generate out-of-fold probabilities

oof_probabilities = cross_val_predict(
    model,
    X_train,
    y_train,
    cv=cv,
    method="predict_proba"
)[:, 1]


# 9. Compare classification thresholds

thresholds = np.arange(0.20, 0.81, 0.05)

results = []

print("\n========== CROSS-VALIDATED THRESHOLD COMPARISON ==========")

for threshold in thresholds:

    predictions = (
        oof_probabilities >= threshold
    ).astype(int)

    precision = precision_score(
        y_train, predictions, zero_division=0
    )

    recall = recall_score(
        y_train, predictions, zero_division=0
    )

    f1 = f1_score(
        y_train, predictions, zero_division=0
    )

    balanced_acc = balanced_accuracy_score(
        y_train, predictions
    )

    results.append({
        "Threshold": round(threshold, 2),
        "Precision": precision,
        "Recall": recall,
        "F1 Score": f1,
        "Balanced Accuracy": balanced_acc
    })

    print(
        f"Threshold: {threshold:.2f} | "
        f"Precision: {precision:.4f} | "
        f"Recall: {recall:.4f} | "
        f"F1: {f1:.4f} | "
        f"Balanced Accuracy: {balanced_acc:.4f}"
    )


# 10. Select threshold using cross-validated F1-score

results_df = pd.DataFrame(results)

best_index = results_df["F1 Score"].idxmax()

best_threshold = results_df.loc[
    best_index, "Threshold"
]

print("\n========== SELECTED THRESHOLD ==========")

print("Best threshold:", best_threshold)

print(
    "Cross-validated F1-score:",
    round(results_df.loc[best_index, "F1 Score"], 4)
)


# 11. Display cross-validated confusion matrix

oof_predictions = (
    oof_probabilities >= best_threshold
).astype(int)

print("\nCross-validated confusion matrix:")
print(confusion_matrix(y_train, oof_predictions))


# 12. Save threshold comparison

results_df.to_csv(
    "datasets/processed/threshold_cv_comparison.csv",
    index=False
)

print("\nThreshold comparison saved successfully.")
