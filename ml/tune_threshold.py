
import pandas as pd

from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    balanced_accuracy_score,
    confusion_matrix
)


# 1. Load processed datasets

train_df = pd.read_csv("datasets/processed/train_encoded.csv")
test_df = pd.read_csv("datasets/processed/test_encoded.csv")

target_col = "Academic_Risk"

X_train = train_df.drop(columns=[target_col])
y_train = train_df[target_col]

X_test = test_df.drop(columns=[target_col])
y_test = test_df[target_col]


# 2. Train Logistic Regression

model = LogisticRegression(
    class_weight="balanced",
    max_iter=2000,
    random_state=42
)

model.fit(X_train, y_train)


# 3. Calculate training probabilities

train_probabilities = model.predict_proba(X_train)[:, 1]

thresholds = [0.20, 0.30, 0.40, 0.50, 0.60]

results = []

print("\n========== TRAINING THRESHOLD COMPARISON ==========")

for threshold in thresholds:

    y_pred = (train_probabilities >= threshold).astype(int)

    precision = precision_score(y_train, y_pred, zero_division=0)
    recall = recall_score(y_train, y_pred, zero_division=0)
    f1 = f1_score(y_train, y_pred, zero_division=0)
    balanced_acc = balanced_accuracy_score(y_train, y_pred)

    results.append({
        "Threshold": threshold,
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


# 4. Select threshold using training F1-score

results_df = pd.DataFrame(results)

best_index = results_df["F1 Score"].idxmax()
best_threshold = results_df.loc[best_index, "Threshold"]

print("\nSelected threshold:", best_threshold)


# 5. Evaluate selected threshold on test data

test_probabilities = model.predict_proba(X_test)[:, 1]

test_predictions = (
    test_probabilities >= best_threshold
).astype(int)

print("\n========== FINAL TEST EVALUATION ==========")

print("Selected threshold:", best_threshold)

print(
    "Precision:",
    round(precision_score(y_test, test_predictions, zero_division=0), 4)
)

print(
    "Recall:",
    round(recall_score(y_test, test_predictions, zero_division=0), 4)
)

print(
    "F1 Score:",
    round(f1_score(y_test, test_predictions, zero_division=0), 4)
)

print(
    "Balanced Accuracy:",
    round(balanced_accuracy_score(y_test, test_predictions), 4)
)

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, test_predictions))
