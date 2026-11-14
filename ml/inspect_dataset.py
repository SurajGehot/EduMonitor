
from pathlib import Path
import pandas as pd

DATA_DIR = Path("datasets/raw")
REPORT_DIR = Path("reports")
REPORT_DIR.mkdir(exist_ok=True)

files = (
    list(DATA_DIR.glob("*.xlsx"))
    + list(DATA_DIR.glob("*.xls"))
    + list(DATA_DIR.glob("*.csv"))
)

if not files:
    raise FileNotFoundError("No dataset found in datasets/raw")

file = files[0]

if file.suffix == ".csv":
    df = pd.read_csv(file)
else:
    df = pd.read_excel(file)

def section(title):
    print("\n" + "=" * 75)
    print(f" {title}")
    print("=" * 75)

lines = []

def report(title, content):
    lines.append("\n" + "=" * 75)
    lines.append(f" {title}")
    lines.append("=" * 75)
    lines.append(str(content))

# 1. General Information
overview = f"""
Dataset Name       : {file.name}
Total Records      : {df.shape[0]}
Total Features     : {df.shape[1]}
Total Cells        : {df.size}
Duplicate Records  : {df.duplicated().sum()}
Memory Usage       : {df.memory_usage(deep=True).sum() / 1024:.2f} KB
"""
section("1. DATASET OVERVIEW")
print(overview)
report("1. DATASET OVERVIEW", overview)

# 2. Feature Information
features = pd.DataFrame({
    "Feature": df.columns,
    "Data Type": df.dtypes.astype(str).values,
    "Unique Values": df.nunique(dropna=True).values,
    "Missing Values": df.isnull().sum().values
})

section("2. FEATURE INFORMATION")
print(features.to_string(index=False))
report("2. FEATURE INFORMATION", features.to_string(index=False))

# 3. Missing Values
missing = df.isnull().sum()
missing = missing[missing > 0]

section("3. MISSING VALUE ANALYSIS")
missing_report = (
    missing.to_string()
    if not missing.empty
    else "No missing values found."
)
print(missing_report)
report("3. MISSING VALUE ANALYSIS", missing_report)

# 4. Numerical Features
numeric_df = df.select_dtypes(include="number")

section("4. NUMERICAL FEATURE SUMMARY")
numeric_summary = numeric_df.describe().T.round(2)
print(numeric_summary.to_string())
report("4. NUMERICAL FEATURE SUMMARY", numeric_summary.to_string())

# 5. Categorical Features
categorical_df = df.select_dtypes(exclude="number")

section("5. CATEGORICAL FEATURE SUMMARY")

for column in categorical_df.columns:
    print(f"\n{column}")
    print("-" * 60)
    print("Unique categories:", df[column].nunique())
    print(df[column].value_counts(dropna=False).head(8).to_string())

report(
    "5. CATEGORICAL FEATURE SUMMARY",
    "\n".join(
        f"\n{col}\n{df[col].value_counts(dropna=False).head(8)}"
        for col in categorical_df.columns
    )
)

# 6. Attendance Investigation
attendance_col = "Average attendance on class"

section("6. ATTENDANCE DATA VALIDATION")

if attendance_col in df.columns:
    attendance = pd.to_numeric(df[attendance_col], errors="coerce")

    attendance_report = f"""
Original Data Type : {df[attendance_col].dtype}
Numeric Values     : {attendance.notna().sum()}
Invalid Values     : {attendance.isna().sum()}
Minimum            : {attendance.min()}
Maximum            : {attendance.max()}
Mean               : {attendance.mean():.2f}
Unique Values      : {attendance.nunique()}
"""
    print(attendance_report)
    report("6. ATTENDANCE DATA VALIDATION", attendance_report)

# 7. Potential Target Features
section("7. POTENTIAL ACADEMIC OUTCOME FEATURES")

target_candidates = [
    "What was your previous SGPA?",
    "What is your current CGPA?",
    "Did you ever fall in probation?"
]

for column in target_candidates:
    if column in df.columns:
        print(f"\n{column}")
        print(df[column].value_counts(dropna=False).head(10))

# 8. Save Report
report_text = "\n".join(lines)

output_file = REPORT_DIR / "dataset_profile.txt"
output_file.write_text(report_text, encoding="utf-8")

print("\n" + "=" * 75)
print("REPORT GENERATED SUCCESSFULLY")
print("=" * 75)
print(f"Saved at: {output_file}")
