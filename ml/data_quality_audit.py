
from pathlib import Path
import pandas as pd

DATA_DIR = Path("datasets/raw")
OUTPUT_DIR = Path("reports")
OUTPUT_DIR.mkdir(exist_ok=True)

file = next(DATA_DIR.glob("*.xlsx"))
df = pd.read_excel(file)

print("\n========== DATA QUALITY AUDIT ==========\n")

# 1. Attendance validation
attendance_col = "Average attendance on class"
df[attendance_col] = pd.to_numeric(
    df[attendance_col], errors="coerce"
)

print("INVALID ATTENDANCE RECORDS")
print(df[df[attendance_col].isna()][[attendance_col]])

# 2. Academic score validation
academic_cols = [
    "What was your previous SGPA?",
    "What is your current CGPA?"
]

print("\nACADEMIC SCORE VALIDATION")

for col in academic_cols:
    print(f"\n{col}")
    print("Zero values:", (df[col] == 0).sum())
    print("Below 0:", (df[col] < 0).sum())
    print("Above 4:", (df[col] > 4).sum())

# 3. Year validation
print("\nYEAR VALIDATION")

year_cols = [
    "University Admission year",
    "H.S.C passing year"
]

for col in year_cols:
    print(f"\n{col}")
    print(df[col].value_counts().sort_index())

# 4. Semester validation
print("\nSEMESTER DISTRIBUTION")
print(df["Current Semester"].value_counts().sort_index())

# 5. Family income investigation
income_col = "What is your monthly family income?"

print("\nFAMILY INCOME OUTLIERS")
print(df.nlargest(10, income_col)[
    ["Age", "Current Semester", income_col]
].to_string(index=False))

# 6. Categorical inconsistency
print("\nHEALTH CATEGORY INVESTIGATION")

health_col = "Do you have any health issues?"

print(df[health_col].value_counts(dropna=False))

print("\nNORMALIZED HEALTH CATEGORIES")
print(
    df[health_col]
    .astype(str)
    .str.strip()
    .str.lower()
    .value_counts()
)

# 7. Correlation analysis
print("\nACADEMIC FEATURE CORRELATION")

numeric_df = df.select_dtypes(include="number")

correlation = numeric_df.corr().round(3)

print(
    correlation[
        academic_cols
    ].to_string()
)

# 8. Save audit report
with open(
    OUTPUT_DIR / "data_quality_audit.txt",
    "w",
    encoding="utf-8"
) as f:

    f.write("DATA QUALITY AUDIT\n\n")

    f.write("Dataset Shape:\n")
    f.write(str(df.shape))

    f.write("\n\nMissing Values:\n")
    f.write(df.isnull().sum().to_string())

    f.write("\n\nAcademic Correlation:\n")
    f.write(correlation[academic_cols].to_string())

    f.write("\n\nHealth Categories:\n")
    f.write(df[health_col].value_counts().to_string())

print("\nAudit completed.")
print("Report saved in reports/data_quality_audit.txt")
