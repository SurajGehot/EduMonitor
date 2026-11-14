

\# EduMonitor

\### Student Academic Early-Warning \& Intervention System



EduMonitor is a machine learning-powered academic early-warning platform designed to identify students who may be at risk of poor academic performance.



The system analyzes academic performance and student engagement indicators to estimate academic risk, visualize risk patterns, and support timely student interventions.



> \*\*Academic prototype:\*\* This project uses a public student performance dataset. It is not an officially deployed Lovely Professional University system and does not use verified institutional LPU student records.



\## Features



\- \*\*Academic Risk Prediction:\*\* Logistic Regression-based risk classification.

\- \*\*Student Directory:\*\* Search, filter, and review student academic records.

\- \*\*Risk Assessment:\*\* Generate predictions using original or manually adjusted assessment inputs.

\- \*\*Dashboard:\*\* Monitor student counts, risk distribution, and assessment coverage.

\- \*\*Analytics:\*\* Explore model performance and academic risk patterns.

\- \*\*Intervention Management:\*\* Create, assign, and track student support interventions.

\- \*\*REST API:\*\* FastAPI endpoints for students, predictions, analytics, and interventions.



\## Technology Stack



| Component | Technology |

|---|---|

| Frontend | React, TypeScript, Vite |

| Styling | Tailwind CSS |

| Backend | Python, FastAPI |

| Database | SQLite, SQLAlchemy |

| Machine Learning | Scikit-learn, Pandas, NumPy |

| Model Persistence | Joblib |

| API Documentation | Swagger UI |



\## Machine Learning



The project uses a Logistic Regression classifier to estimate academic risk.



\- Input features: 12

\- Classification target: CGPA below 2.5

\- Decision threshold: 0.75

\- Output: Estimated academic risk probability and classification.



The target definition and threshold are experimental project choices, not official university policies.



\### Model Evaluation



| Metric | Result |

|---|---:|

| Accuracy | 96.23% |

| Precision | 76.47% |

| Recall | 72.22% |

| F1 Score | 74.29% |

| Balanced Accuracy | 85.21% |

| PR-AUC | 85.17% |



These are preliminary held-out evaluation results. The test set was inspected during model selection, so these metrics should not be interpreted as an independent final benchmark or a guarantee of real-world performance.



\## Project Structure



```text

StudentAcademicEarlyWarning/

│

├── backend/

│   ├── app/

│   │   ├── routes/

│   │   ├── services/

│   │   ├── database.py

│   │   ├── main.py

│   │   ├── models.py

│   │   └── schemas.py

│   ├── import\_students.py

│   └── assess\_all\_students.py

│

├── frontend/

│   ├── src/

│   │   ├── components/

│   │   ├── pages/

│   │   └── services/

│   ├── package.json

│   └── vite.config.ts

│

├── ml/

│   ├── prepare\_dataset.py

│   ├── train\_model.py

│   ├── compare\_models\_cv.py

│   ├── tune\_threshold.py

│   └── data\_quality\_audit.py

│

├── models/

│   └── academic\_risk\_pipeline.joblib

│

├── reports/

├── requirements.txt

└── README.md

```



\## Installation and Setup



\### Prerequisites



\- Python 3.11 or newer

\- Node.js and npm

\- Git



\### 1. Clone the repository



```bash

git clone https://github.com/YOUR\_USERNAME/EduMonitor.git

cd EduMonitor

```



\### 2. Create a Python environment



```powershell

python -m venv .venv

.venv\\Scripts\\Activate.ps1

```



\### 3. Install Python dependencies



```bash

pip install -r requirements.txt

```



\### 4. Start the backend



From the project root:



```bash

python -m uvicorn app.main:app --reload --app-dir backend

```



Backend URL:



http://127.0.0.1:8000



Interactive API documentation:



http://127.0.0.1:8000/docs



\### 5. Install frontend dependencies



Open another terminal:



```bash

cd frontend

npm install

```



\### 6. Start the frontend



```bash

npm run dev

```



Open the local URL displayed by Vite, normally:



http://localhost:5173



\## Dataset



Model development uses the public Students Academic Performance Evaluation Dataset (2024).



The raw and processed datasets are excluded from this repository. Obtain the dataset from its original source and place it in the expected local directory before running the data preparation and training scripts.



\## API Modules



| Module | Responsibility |

|---|---|

| Students | Student records and directory |

| Predictions | Risk assessment and prediction history |

| Analytics | Risk distribution and model metrics |

| Interventions | Student support and intervention tracking |



\## Limitations



\- The project uses public research data rather than verified institutional LPU records.

\- Risk probabilities are model estimates, not confirmed future academic outcomes.

\- The target definition and decision threshold are experimental.

\- Performance may differ when applied to real institutional data.

\- Intervention decisions require human review and institutional context.



\## Future Scope



\- Integration with verified institutional academic data.

\- Explainable AI for identifying contributing risk factors.

\- Periodic model retraining and performance monitoring.

\- Role-based access for faculty, mentors, and administrators.

\- Advanced intervention recommendation mechanisms.



\## License



No open-source license has been added yet. All rights and third-party dataset terms remain subject to their respective owners until a license is selected.



