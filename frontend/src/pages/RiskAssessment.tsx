
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  LoaderCircle,
  Search,
  UserRound,
  Database
} from "lucide-react";

import {
  api,
  type PredictionInput,
  type PredictionResponse,
  type Student,
  type StudentDetails
} from "../services/api";

import { PageHeading, Panel, RiskPill } from "../components/Ui";

const initial: PredictionInput = {
  previous_sgpa: 7,
  current_semester: 3,
  daily_study_hours: 3,
  study_sessions_per_day: 2,
  daily_social_media_hours: 2,
  attendance: 80,
  teacher_consultancy: "No",
  daily_skill_development_hours: 1,
  cocurricular_activities: "No",
  completed_credits: 40,
  learning_mode: "Offline",
  english_proficiency: "Intermediate"
};

export default function RiskAssessment() {
  const [form, setForm] = useState<PredictionInput>(initial);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [searching, setSearching] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(false);

  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Search registered students
  useEffect(() => {
    if (!studentSearch.trim() || selectedStudent) {
      setStudentResults([]);
      return;
    }

    let active = true;

    async function searchStudents() {
      setSearching(true);

      try {
        const response = await api.getStudents({
          search: studentSearch.trim(),
          page: 1,
          page_size: 8
        });

        if (active) {
          setStudentResults(response.students);
        }
      } catch {
        if (active) {
          setStudentResults([]);
        }
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    }

    void searchStudents();

    return () => {
      active = false;
    };
  }, [studentSearch, selectedStudent]);

  // Select student and automatically populate all 12 features
  async function selectStudent(student: Student) {
    setSelectedStudent(student);
    setStudentSearch(`${student.name} (${student.student_id})`);

    setStudentResults([]);
    setResult(null);
    setError("");
    setLoadingStudent(true);

    try {
      const details: StudentDetails = await api.getStudent(student.id);

      setForm({
        previous_sgpa: details.previous_sgpa,
        current_semester: details.current_semester,
        daily_study_hours: details.daily_study_hours,
        study_sessions_per_day: details.study_sessions_per_day,
        daily_social_media_hours: details.daily_social_media_hours,
        attendance: details.attendance,
        teacher_consultancy: details.teacher_consultancy,
        daily_skill_development_hours: details.daily_skill_development_hours,
        cocurricular_activities: details.cocurricular_activities,
        completed_credits: details.completed_credits,
        learning_mode: details.learning_mode,
        english_proficiency: details.english_proficiency
      });

      // Use complete details returned by the API
      setSelectedStudent({
        ...student,
        risk_status: details.risk_status,
        risk_probability: details.risk_probability,
        decision_threshold: details.decision_threshold
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the student's academic information."
      );
    } finally {
      setLoadingStudent(false);
    }
  }

  // Update individual input fields
  const update = <K extends keyof PredictionInput>(
    key: K,
    value: PredictionInput[K]
  ) => {
    setForm(current => ({
      ...current,
      [key]: value
    }));
  };

  // Submit assessment using modified or original values
  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedStudent) {
      setError("Please select a registered student before running the assessment.");
      return;
    }

    if (loadingStudent) {
      setError("Please wait until the student record has loaded.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const payload: PredictionInput = {
        ...form,
        student_record_id: selectedStudent.id
      };

      const response = await api.createPrediction(payload);

      setResult(response);

      // Refresh Dashboard and Analytics immediately
      window.dispatchEvent(
        new Event("edumonitor:data-updated")
      );

      // Refresh the selected student's latest risk information
      const updatedDetails = await api.getStudent(selectedStudent.id);

      setSelectedStudent(current =>
        current
          ? {
              ...current,
              risk_status: updatedDetails.risk_status,
              risk_probability: updatedDetails.risk_probability,
              decision_threshold: updatedDetails.decision_threshold
            }
          : current
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Prediction failed."
      );
    } finally {
      setBusy(false);
    }
  }

  // Assessment input definitions
  const fields: Array<{
    key: keyof PredictionInput;
    label: string;
    type: "number" | "select";
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
  }> = [
    {
      key: "previous_sgpa",
      label: "Previous SGPA",
      type: "number",
      min: 0,
      max: 10,
      step: 0.01
    },
    {
      key: "current_semester",
      label: "Current semester",
      type: "number",
      min: 1,
      max: 24
    },
    {
      key: "daily_study_hours",
      label: "Daily study hours",
      type: "number",
      min: 0,
      max: 24,
      step: 0.5
    },
    {
      key: "study_sessions_per_day",
      label: "Study sessions per day",
      type: "number",
      min: 0,
      max: 24
    },
    {
      key: "daily_social_media_hours",
      label: "Daily social media hours",
      type: "number",
      min: 0,
      max: 24,
      step: 0.5
    },
    {
      key: "attendance",
      label: "Average attendance (%)",
      type: "number",
      min: 0,
      max: 100
    },
    {
      key: "teacher_consultancy",
      label: "Teacher consultancy",
      type: "select",
      options: ["Yes", "No"]
    },
    {
      key: "daily_skill_development_hours",
      label: "Daily skill development hours",
      type: "number",
      min: 0,
      max: 24,
      step: 0.5
    },
    {
      key: "cocurricular_activities",
      label: "Co-curricular activities",
      type: "select",
      options: ["Yes", "No"]
    },
    {
      key: "completed_credits",
      label: "Completed credits",
      type: "number",
      min: 0,
      max: 300
    },
    {
      key: "learning_mode",
      label: "Preferred learning mode",
      type: "select",
      options: ["Online", "Offline", "Hybrid"]
    },
    {
      key: "english_proficiency",
      label: "English proficiency",
      type: "select",
      options: ["Beginner", "Intermediate", "Advanced", "Fluent"]
    }
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-7 p-6 lg:p-8">

      <PageHeading
        eyebrow="Machine Learning"
        title="Risk Assessment"
        description="Evaluate academic and engagement indicators using the trained Logistic Regression pipeline."
      />

      {/* Research Disclaimer */}

      <div className="rounded-xl border border-[#E4D8BD] bg-[#F1EBDD] p-4 text-xs leading-5 text-[#716044]">
        This prototype uses a public research dataset and demonstration records.
        Its predictions estimate similarity to the project's defined academic
        risk category; they do not establish future academic failure or official
        university policy.
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">

        {/* Assessment Form */}

        <Panel
          title="Student Assessment Form"
          subtitle="Select a registered student to automatically load their academic information."
        >

          <form onSubmit={submit} className="space-y-5">

            {/* Student Selection */}

            <div className="relative">
              <label className="mb-2 block text-xs font-medium text-[#655F53]">
                Select Student
              </label>

              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D887D]"
                />

                <input
                  value={studentSearch}
                  onChange={e => {
                    setStudentSearch(e.target.value);
                    setSelectedStudent(null);
                    setStudentResults([]);
                    setForm(initial);
                    setResult(null);
                    setError("");
                  }}
                  placeholder="Search by student name or 8-digit ID..."
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#F5F2EA] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#AA8D54]"
                />
              </div>

              {searching && (
                <p className="mt-2 text-xs text-[#8D887D]">
                  Searching students...
                </p>
              )}

              {studentResults.length > 0 && (
                <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#E8E2D5] bg-[#FBFAF6] shadow-lg">
                  {studentResults.map(student => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => void selectStudent(student)}
                      className="w-full border-b border-[#EEEAE0] px-4 py-3 text-left hover:bg-[#F0EDE5]"
                    >
                      <p className="text-sm font-medium text-[#292720]">
                        {student.name}
                      </p>

                      <p className="mt-1 text-xs text-[#8D887D]">
                        {student.student_id} · Semester {student.current_semester}
                      </p>

                      {student.risk_status && (
                        <p className="mt-1 text-xs text-[#AA8D54]">
                          Latest assessment: {student.risk_status}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {loadingStudent && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#E8E2D5] bg-[#F5F2EA] p-3">
                  <LoaderCircle
                    size={16}
                    className="animate-spin text-[#AA8D54]"
                  />
                  <span className="text-xs text-[#655F53]">
                    Loading original student dataset values...
                  </span>
                </div>
              )}

              {selectedStudent && !loadingStudent && (
                <div className="mt-3 rounded-xl border border-[#DCE6D9] bg-[#EDF3EB] p-3">
                  <div className="flex items-center gap-2 text-[#55765A]">
                    <UserRound size={16} />
                    <span className="text-xs font-semibold">
                      Student selected
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-[#292720]">
                    {selectedStudent.name}
                  </p>

                  <p className="mt-1 text-xs text-[#77736A]">
                    ID: {selectedStudent.student_id} · Semester {selectedStudent.current_semester}
                  </p>

                  <div className="mt-3 border-t border-[#DCE6D9] pt-3">
                    <p className="text-xs text-[#77736A]">
                      Previous risk classification
                    </p>

                    {selectedStudent.risk_status ? (
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <RiskPill risk={selectedStudent.risk_status} />

                        {selectedStudent.risk_probability !== null && (
                          <span className="text-xs font-semibold text-[#655F53]">
                            {(selectedStudent.risk_probability * 100).toFixed(2)}% probability
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[#77736A]">
                        This student has not been assessed yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dataset Information */}

            {selectedStudent && !loadingStudent && (
              <div className="flex items-start gap-2 rounded-xl border border-[#E4D8BD] bg-[#F1EBDD] p-3">
                <Database
                  size={15}
                  className="mt-0.5 shrink-0 text-[#AA8D54]"
                />

                <p className="text-xs leading-5 text-[#716044]">
                  Original dataset values have been loaded automatically.
                  You can modify any field below. Changes will be saved
                  only with the new assessment and will not overwrite
                  the original student record.
                </p>
              </div>
            )}

            {/* Assessment Fields */}

            <div className="border-t border-[#E8E2D5] pt-4">
              <h3 className="text-sm font-semibold text-[#292720]">
                Academic and Engagement Indicators
              </h3>

              <p className="mt-1 text-xs text-[#8D887D]">
                All 12 features are editable before submitting the assessment.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {fields.map(field => (
                <label key={field.key} className="block">

                  <span className="mb-2 block text-xs font-medium text-[#655F53]">
                    {field.label}
                  </span>

                  {field.type === "select" ? (
                    <select
                      required
                      disabled={!selectedStudent || loadingStudent}
                      value={String(form[field.key] ?? "")}
                      onChange={e =>
                        update(field.key, e.target.value as never)
                      }
                      className="w-full rounded-xl border border-[#E8E2D5] bg-[#F5F2EA] px-3 py-3 text-sm text-[#292720] outline-none focus:border-[#AA8D54] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {field.options?.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      required
                      disabled={!selectedStudent || loadingStudent}
                      min={field.min}
                      max={field.max}
                      step={field.step ?? 1}
                      value={Number(form[field.key] ?? 0)}
                      onChange={e =>
                        update(field.key, Number(e.target.value) as never)
                      }
                      className="w-full rounded-xl border border-[#E8E2D5] bg-[#F5F2EA] px-3 py-3 text-sm text-[#292720] outline-none focus:border-[#AA8D54] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  )}

                </label>
              ))}

            </div>

            {/* Error */}

            {error && (
              <div className="rounded-xl border border-[#E7C8C1] bg-[#FBF0ED] p-3 text-xs text-[#A8584C]">
                {error}
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={busy || loadingStudent || !selectedStudent}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#AA8D54] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#967A43] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Assessing...
                </>
              ) : (
                <>
                  <ClipboardCheck size={16} />
                  Run Risk Assessment
                </>
              )}
            </button>

            {!selectedStudent && (
              <p className="text-center text-xs text-[#8D887D]">
                Select a registered student to load their dataset values and enable assessment.
              </p>
            )}

          </form>
        </Panel>

        {/* Prediction Result */}

        <Panel
          title="Prediction Result"
          subtitle="The latest model response will appear here."
        >

          {!result ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEE7D8] text-[#806A3E]">
                <Activity size={25} />
              </div>

              <p className="mt-4 text-sm font-semibold text-[#292720]">
                Awaiting Assessment
              </p>

              <p className="mt-2 max-w-xs text-xs leading-5 text-[#8D887D]">
                Select a student, review their automatically populated
                academic information, and run the model to see the
                estimated risk probability and classification.
              </p>

            </div>
          ) : (
            <div className="space-y-6">

              <div className="rounded-xl bg-[#F5F2EA] p-4">
                <p className="text-xs text-[#8D887D]">
                  Assessed student
                </p>

                <p className="mt-1 text-sm font-semibold text-[#292720]">
                  {selectedStudent?.name}
                </p>

                <p className="mt-1 text-xs text-[#77736A]">
                  {selectedStudent?.student_id}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-[#77736A]">
                  Classification
                </span>

                <RiskPill risk={result.prediction} />
              </div>

              <div>
                <p className="text-xs text-[#8D887D]">
                  Model-estimated risk probability
                </p>

                <p className="mt-1 text-4xl font-semibold text-[#292720]">
                  {(result.risk_probability * 100).toFixed(2)}%
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEEAE0]">
                  <div
                    className="h-full rounded-full bg-[#AA8D54] transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.max(0, result.risk_probability * 100))}%`
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[#F5F2EA] p-4 text-xs text-[#655F53]">
                Decision threshold:{" "}
                <strong>
                  {(result.decision_threshold * 100).toFixed(0)}%
                </strong>
              </div>

              {result.prediction_id && (
                <p className="text-xs text-[#8D887D]">
                  Prediction reference: #{result.prediction_id}
                </p>
              )}

              {result.message && (
                <p className="text-xs text-[#77736A]">
                  {result.message}
                </p>
              )}

              <div className="flex items-start gap-2 border-t border-[#E8E2D5] pt-4 text-xs leading-5 text-[#8D887D]">
                <AlertTriangle
                  size={15}
                  className="mt-0.5 shrink-0 text-[#AA8D54]"
                />
                This prediction is a decision-support signal, not a final
                judgement about a student.
              </div>

            </div>
          )}

        </Panel>

      </div>
    </div>
  );
}
