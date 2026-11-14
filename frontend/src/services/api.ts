
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch {
    throw new ApiError(
      "Cannot reach the FastAPI server. Start the backend and try again."
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const body = await response.json();
      message = body.detail || body.message || message;
    } catch {
      // Keep the default HTTP error message.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}


// Student list information
export interface Student {
  id: number;
  student_id: string;
  name: string;
  current_semester: number;
  previous_sgpa: number | null;
  attendance: number | null;
  risk_status: "At Risk" | "Not at Risk" | null;
  risk_probability: number | null;
  decision_threshold: number | null;
  data_source: string;
  created_at?: string;
}


// Complete student record with all 12 assessment features
export interface StudentDetails extends Student {
  previous_sgpa: number;
  current_semester: number;
  daily_study_hours: number;
  study_sessions_per_day: number;
  daily_social_media_hours: number;
  attendance: number;
  teacher_consultancy: string;
  daily_skill_development_hours: number;
  cocurricular_activities: string;
  completed_credits: number;
  learning_mode: string;
  english_proficiency: string;

  current_cgpa: number;
}


// Student list response
export interface StudentListResponse {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}


// Risk assessment input
export interface PredictionInput {
  student_record_id?: number;
  previous_sgpa: number;
  current_semester: number;
  daily_study_hours: number;
  study_sessions_per_day: number;
  daily_social_media_hours: number;
  attendance: number;
  teacher_consultancy: string;
  daily_skill_development_hours: number;
  cocurricular_activities: string;
  completed_credits: number;
  learning_mode: string;
  english_proficiency: string;
  student_id?: string;
  student_name?: string;
}


// Risk assessment response
export interface PredictionResponse {
  prediction_id?: number;
  risk_probability: number;
  decision_threshold: number;
  prediction: "At Risk" | "Not at Risk";
  supporting_indicators?: Array<{
    feature: string;
    value: string | number;
    explanation: string;
  }>;
  message?: string;
}


// Prediction history
export interface PredictionHistoryItem {
  prediction_id: number;
  student_record_id: number | null;
  student_id: string | null;
  student_name: string | null;
  risk_probability: number;
  decision_threshold: number;
  prediction: "At Risk" | "Not at Risk";
  created_at: string;
}

export interface PredictionHistoryResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  predictions: PredictionHistoryItem[];
}


// Intervention information
export interface Intervention {
  id: string;
  student_id: string;
  student_name: string;
  issue: string;
  action: string;
  assigned_to: string;
  status: "Pending" | "In Progress" | "Resolved";
  due_date: string | null;
  created_at?: string;
}

export interface InterventionListResponse {
  items: Intervention[];
  total: number;
}


// Analytics summary
export interface AnalyticsSummary {
  total_students: number;
  at_risk: number;
  not_at_risk: number;
  risk_percentage: number;

  model_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    balanced_accuracy: number;
    pr_auc: number;
  };

  risk_distribution: Array<{
    name: string;
    value: number;
  }>;

  intervention_summary: {
    pending: number;
    in_progress: number;
    resolved: number;
  };

  recent_assessments: Array<{
    id: string;
    student_id: string;
    student_name: string;
    prediction: "At Risk" | "Not at Risk";
    risk_probability: number;
    assessed_at: string;
  }>;
}


// Dashboard summary
export interface DashboardSummary {
  total_students: number;
  assessed: number;
  not_assessed: number;
  at_risk: number;
  not_at_risk: number;
  at_risk_percentage: number;
  not_at_risk_percentage: number;
  assessment_coverage: number;
}


// API methods
export const api = {

  // Search and retrieve students
  getStudents: (params: {
    search?: string;
    risk?: string;
    page?: number;
    page_size?: number;
  } = {}) => {
    const query = new URLSearchParams();

    if (params.search) {
      query.set("search", params.search);
    }

    if (params.risk && params.risk !== "All") {
      query.set("risk", params.risk);
    }

    if (params.page !== undefined) {
      query.set("page", String(params.page));
    }

    if (params.page_size !== undefined) {
      query.set("limit", String(params.page_size));
    }

    return request<StudentListResponse>(
      `/api/v1/students?${query.toString()}`
    );
  },


  // Retrieve complete student details using database record ID
  getStudent: (studentRecordId: number) =>
    request<StudentDetails>(
      `/api/v1/students/${studentRecordId}`
    ),


  // Retrieve prediction history
  getPredictions: (params: {
    page?: number;
    limit?: number;
    student_record_id?: number;
  } = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.set(key, String(value));
      }
    });

    return request<PredictionHistoryResponse>(
      `/api/v1/predictions?${query.toString()}`
    );
  },


  // Submit a new risk assessment
  createPrediction: (input: PredictionInput) =>
    request<PredictionResponse>("/api/v1/predictions", {
      method: "POST",
      body: JSON.stringify(input)
    }),


  // Retrieve interventions
  getInterventions: (status?: string) => {
    const query =
      status && status !== "All"
        ? `?status=${encodeURIComponent(status)}`
        : "";

    return request<InterventionListResponse>(
      `/api/v1/interventions${query}`
    );
  },


  // Create intervention
  createIntervention: (
    input: Omit<Intervention, "id" | "created_at">
  ) =>
    request<Intervention>("/api/v1/interventions", {
      method: "POST",
      body: JSON.stringify(input)
    }),


  // Update intervention
  updateIntervention: (
    id: string,
    input: Partial<
      Pick<
        Intervention,
        "status" | "assigned_to" | "due_date" | "action"
      >
    >
  ) =>
    request<Intervention>(
      `/api/v1/interventions/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(input)
      }
    ),


  // Retrieve analytics
  getAnalytics: () =>
    request<AnalyticsSummary>("/api/v1/analytics/summary"),


  // Retrieve dashboard summary
  getDashboardSummary: () =>
    request<DashboardSummary>("/api/v1/dashboard/summary")

};
