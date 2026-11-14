
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_predict
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    balanced_accuracy_score,
    average_precision_score
)


# 1. Load and clean dataset

df = pd.read_excel(
    "datasets/raw/Students_Performance_data_set.xlsx"
)

for col in df.select_dtypes(include=["object", "str"]).columns:
    df[col] = df[col].astype("string").str.strip()

df["Average attendance on class"] = pd.to_numeric(
    df["Average attendance on class"],
    errors="coerce"
)

df = df.drop_duplicates()

constant_cols = [
    col for col in df.columns
    if df[col].nunique(dropna=False) <= 1
]

df = df.drop(columns=constant_cols)


# 2. Create target

df["Academic_Risk"] = (
    df["What is your current CGPA?"] < 2.5
).astype(int)


# 3. Select features

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


# 4. Train-test split

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# 5. Create preprocessing pipeline

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


# 6. Define models

models = {
    "Logistic Regression": LogisticRegression(
        class_weight="balanced",
        max_iter=2000,
        random_state=42
    ),

    "Random Forest": RandomForestClassifier(
        n_estimators=300,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
}


# 7. Cross-validation configuration

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

thresholds = np.arange(0.20, 0.81, 0.05)

final_results = []


# 8. Compare models

for name, classifier in models.items():

    print("\n========================================")
    print(name)
    print("========================================")

    model = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier)
    ])

    oof_probabilities = cross_val_predict(
        model,
        X_train,
        y_train,
        cv=cv,
        method="predict_proba"
    )[:, 1]

    threshold_results = []

    for threshold in thresholds:

        oof_predictions = (
            oof_probabilities >= threshold
        ).astype(int)

        precision = precision_score(
            y_train, oof_predictions, zero_division=0
        )

        recall = recall_score(
            y_train, oof_predictions, zero_division=0
        )

        f1 = f1_score(
            y_train, oof_predictions, zero_division=0
        )

        threshold_results.append({
            "Threshold": round(threshold, 2),
            "Precision": precision,
            "Recall": recall,
            "F1 Score": f1
        })

    threshold_df = pd.DataFrame(threshold_results)

    best_index = threshold_df["F1 Score"].idxmax()
    best_threshold = threshold_df.loc[best_index, "Threshold"]

    print("Selected CV threshold:", best_threshold)
    print(
        "Cross-validated F1:",
        round(threshold_df.loc[best_index, "F1 Score"], 4)
    )

    # Train on the complete training set

    model.fit(X_train, y_train)

    # Evaluate on the held-out test set

    test_probabilities = model.predict_proba(X_test)[:, 1]

    test_predictions = (
        test_probabilities >= best_threshold
    ).astype(int)

    precision = precision_score(
        y_test, test_predictions, zero_division=0
    )

    recall = recall_score(
        y_test, test_predictions, zero_division=0
    )

    f1 = f1_score(
        y_test, test_predictions, zero_division=0
    )

    balanced_acc = balanced_accuracy_score(
        y_test, test_predictions
    )

    pr_auc = average_precision_score(
        y_test, test_probabilities
    )

    print("\nTest Set Results:")
    print("Precision:", round(precision, 4))
    print("Recall:", round(recall, 4))
    print("F1 Score:", round(f1, 4))
    print("Balanced Accuracy:", round(balanced_acc, 4))
    print("PR-AUC:", round(pr_auc, 4))

    final_results.append({
        "Model": name,
        "Selected Threshold": best_threshold,
        "Precision": precision,
        "Recall": recall,
        "F1 Score": f1,
        "Balanced Accuracy": balanced_acc,
        "PR-AUC": pr_auc
    })


# 9. Final comparison

comparison_df = pd.DataFrame(final_results)

print("\n========== FINAL MODEL COMPARISON ==========")
print(comparison_df.round(4).to_string(index=False))

comparison_df.to_csv(
    "datasets/processed/final_model_comparison.csv",
    index=False
)

print("\nFinal comparison saved successfully.")
