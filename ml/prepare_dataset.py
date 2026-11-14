
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# 1. Load and clean dataset

df = pd.read_excel("datasets/raw/Students_Performance_data_set.xlsx")

for col in df.select_dtypes(include=["object", "str"]).columns:
    df[col] = df[col].astype("string").str.strip()

df["Average attendance on class"] = pd.to_numeric(
    df["Average attendance on class"], errors="coerce"
)

df["What are your health issues?"] = (
    df["What are your health issues?"]
    .replace({"no": "No", "n": "No", "yes": "Yes"})
) if "What are your health issues?" in df.columns else None

df = df.drop_duplicates()

constant_cols = [
    col for col in df.columns
    if df[col].nunique(dropna=False) <= 1
]

df = df.drop(columns=constant_cols)

print("Cleaned dataset shape:", df.shape)
print("Removed constant columns:", constant_cols)


# 2. Create target variable

target_col = "Academic_Risk"

df[target_col] = (
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

model_df = df[feature_cols + [target_col]].copy()

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

for col in numeric_features:
    model_df[col] = pd.to_numeric(model_df[col], errors="coerce")

X = model_df[feature_cols]
y = model_df[target_col]


# 4. Stratified train-test split

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# 5. Build preprocessing pipelines

numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(
        handle_unknown="ignore",
        sparse_output=False
    ))
])

preprocessor = ColumnTransformer([
    ("numeric", numeric_pipeline, numeric_features),
    ("categorical", categorical_pipeline, categorical_features)
])


# 6. Fit on training data and transform both datasets

X_train_processed = preprocessor.fit_transform(X_train)
X_test_processed = preprocessor.transform(X_test)

feature_names = preprocessor.get_feature_names_out()

X_train_processed = pd.DataFrame(
    X_train_processed,
    columns=feature_names,
    index=X_train.index
)

X_test_processed = pd.DataFrame(
    X_test_processed,
    columns=feature_names,
    index=X_test.index
)


# 7. Save processed datasets

train_output = X_train_processed.copy()
train_output[target_col] = y_train

test_output = X_test_processed.copy()
test_output[target_col] = y_test

train_output.to_csv(
    "datasets/processed/train_encoded.csv", index=False
)

test_output.to_csv(
    "datasets/processed/test_encoded.csv", index=False
)

model_df.to_csv(
    "datasets/processed/students_modeling_dataset.csv", index=False
)


# 8. Display verification results

print("\n========== FINAL PREPROCESSING RESULTS ==========")

print("Training shape:", X_train_processed.shape)
print("Testing shape:", X_test_processed.shape)

print("\nTraining target distribution:")
print(y_train.value_counts())

print("\nTesting target distribution:")
print(y_test.value_counts())

print("\nMissing values in training data:",
      X_train_processed.isnull().sum().sum())

print("Missing values in testing data:",
      X_test_processed.isnull().sum().sum())

print("\nTraining numerical feature means:")
print(X_train_processed[
    [f"numeric__{col}" for col in numeric_features]
].mean().round(4))

print("\nTraining numerical feature standard deviations:")
print(X_train_processed[
    [f"numeric__{col}" for col in numeric_features]
].std(ddof=0).round(4))

print("\nFinal feature count:", len(feature_names))
print("\nPreprocessing completed successfully.")
