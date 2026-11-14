
import { useCallback, useEffect, useState } from "react";
import {
  Users,
  AlertTriangle,
  Activity,
  ClipboardCheck,
  ShieldCheck,
  RefreshCw,
  Database,
  Clock,
  TrendingUp
} from "lucide-react";

import { api } from "../services/api";
import type {
  DashboardSummary,
  PredictionHistoryItem
} from "../services/api";

const performanceMetrics = [
  { label: "Accuracy", value: 96.23 },
  { label: "Precision", value: 76.47 },
  { label: "Recall", value: 72.22 },
  { label: "F1 Score", value: 74.29 },
  { label: "Balanced Accuracy", value: 85.21 }
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Users;
  iconColor: string;
}) {
  return (
    <div className="bg-[#FBFAF6] border border-[#E8E2D5] rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#77736A]">{title}</p>
          <h2 className="text-3xl font-semibold text-[#292720] mt-3">
            {value}
          </h2>
          <p className="text-xs text-[#8D887D] mt-2">{description}</p>
        </div>

        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentPredictions, setRecentPredictions] = useState<
    PredictionHistoryItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [summaryResult, predictionResult] = await Promise.all([
        api.getDashboardSummary(),
        api.getPredictions({ page: 1, limit: 8 })
      ]);

      setSummary(summaryResult);
      setRecentPredictions(predictionResult.predictions);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const handleDataUpdate = () => {
      loadDashboard(true);
    };

    window.addEventListener("edumonitor:data-updated", handleDataUpdate);

    const refreshInterval = window.setInterval(() => {
      loadDashboard(true);
    }, 20000);

    return () => {
      window.removeEventListener("edumonitor:data-updated", handleDataUpdate);
      window.clearInterval(refreshInterval);
    };
  }, [loadDashboard]);

  const riskDistribution = summary
    ? [
      {
        label: "At Risk",
        count: summary.at_risk,
        percentage: summary.assessed > 0
          ? (summary.at_risk / summary.assessed) * 100
          : 0,
        color: "bg-[#B96556]",
        textColor: "text-[#B96556]"
      },
      {
        label: "Not at Risk",
        count: summary.not_at_risk,
        percentage: summary.assessed > 0
          ? (summary.not_at_risk / summary.assessed) * 100
          : 0,
        color: "bg-[#78917A]",
        textColor: "text-[#78917A]"
      },
      {
        label: "Not Assessed",
        count: summary.not_assessed,
        percentage: summary.total_students > 0
          ? (summary.not_assessed / summary.total_students) * 100
          : 0,
        color: "bg-[#AA8D54]",
        textColor: "text-[#AA8D54]"
      }
    ]
    : [];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">

      {/* Page Heading */}

      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#AA8D54]">
            Academic Monitoring
          </p>

          <h1 className="text-2xl lg:text-3xl font-semibold text-[#292720] mt-2">
            Academic Overview
          </h1>

          <p className="text-sm text-[#77736A] mt-2">
            Live overview of academic risk, assessments, and model performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-[#77736A] bg-[#FBFAF6] border border-[#E8E2D5] rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Database size={15} className="text-[#AA8D54]" />
            <span>
              Live Database
              {lastUpdated && (
                <span className="ml-2 text-[#AA8D54]">
                  · Updated {lastUpdated.toLocaleTimeString("en-IN")}
                </span>
              )}
            </span>
          </div>

          <button
            onClick={() => loadDashboard(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E2D5] bg-[#FBFAF6] text-sm text-[#655F53] hover:bg-[#F0EDE5] disabled:opacity-50 transition"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </section>

      {/* Error State */}

      {error && (
        <div className="rounded-xl border border-[#E7C8C1] bg-[#FBF0ED] p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#B96556] mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#8F493D]">
              Dashboard data could not be loaded
            </p>
            <p className="text-xs text-[#8F493D] mt-1">{error}</p>
            <button
              onClick={() => loadDashboard(true)}
              className="text-xs font-semibold text-[#8F493D] underline mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}

      {loading && !summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 rounded-2xl bg-[#FBFAF6] border border-[#E8E2D5] animate-pulse"
            />
          ))}
        </div>
      ) : summary ? (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <MetricCard
              title="Total Student Records"
              value={summary.total_students.toLocaleString("en-IN")}
              description="Records stored in the database"
              icon={Users}
              iconColor="bg-[#E9E0CD] text-[#78643D]"
            />

            <MetricCard
              title="Students At Risk"
              value={summary.at_risk.toLocaleString("en-IN")}
              description={`${summary.at_risk_percentage}% of assessed students`}
              icon={AlertTriangle}
              iconColor="bg-[#F3E3DE] text-[#B96556]"
            />

            <MetricCard
              title="Not at Risk"
              value={summary.not_at_risk.toLocaleString("en-IN")}
              description={`${summary.not_at_risk_percentage}% of assessed students`}
              icon={ShieldCheck}
              iconColor="bg-[#E3EBE2] text-[#66836A]"
            />

            <MetricCard
              title="Not Assessed"
              value={summary.not_assessed.toLocaleString("en-IN")}
              description="Records without a linked prediction"
              icon={ClipboardCheck}
              iconColor="bg-[#EEEAE0] text-[#78643D]"
            />
          </section>

          {/* Assessment Coverage */}

          <section className="bg-[#FBFAF6] border border-[#E8E2D5] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#292720]">
                  Assessment Coverage
                </h3>
                <p className="text-xs text-[#8D887D] mt-1">
                  Percentage of student records with a linked risk assessment
                </p>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp size={17} className="text-[#AA8D54]" />
                <span className="text-xl font-semibold text-[#292720]">
                  {summary.assessment_coverage.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="h-3 bg-[#EEEAE0] rounded-full overflow-hidden mt-5">
              <div
                className="h-full bg-[#AA8D54] rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(summary.assessment_coverage, 100)}%`
                }}
              />
            </div>

            <div className="flex justify-between text-xs text-[#8D887D] mt-3">
              <span>{summary.assessed.toLocaleString("en-IN")} assessed</span>
              <span>{summary.not_assessed.toLocaleString("en-IN")} remaining</span>
            </div>
          </section>

          {/* Analytics and Model Performance */}

          <section className="grid grid-cols-1 xl:grid-cols-5 gap-5">

            {/* Risk Distribution */}

            <div className="xl:col-span-3 bg-[#FBFAF6] border border-[#E8E2D5] rounded-2xl p-6">
              <div>
                <h3 className="text-base font-semibold text-[#292720]">
                  Risk Distribution
                </h3>
                <p className="text-xs text-[#8D887D] mt-1">
                  Latest prediction for each assessed student
                </p>
              </div>

              <div className="mt-8 space-y-7">
                {riskDistribution.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="text-sm text-[#655F53]">
                          {item.label}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-semibold text-[#292720]">
                          {item.count.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-[#8D887D] ml-2">
                          {item.percentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="h-3 bg-[#EEEAE0] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-700`}
                        style={{
                          width: `${Math.min(item.percentage, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 pt-5 border-t border-[#E8E2D5]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8D887D]">
                    Assessed student records
                  </span>
                  <span className="text-sm font-semibold text-[#292720]">
                    {summary.assessed.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Model Performance */}

            <div className="xl:col-span-2 bg-[#FBFAF6] border border-[#E8E2D5] rounded-2xl p-6">
              <div>
                <h3 className="text-base font-semibold text-[#292720]">
                  Model Performance
                </h3>

                <p className="text-xs text-[#8D887D] mt-1">
                  Held-out test set · Logistic Regression
                </p>
              </div>

              <div className="mt-7 space-y-5">
                {performanceMetrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-[#655F53]">
                        {metric.label}
                      </span>
                      <span className="text-sm font-semibold text-[#292720]">
                        {metric.value.toFixed(2)}%
                      </span>
                    </div>

                    <div className="h-2 bg-[#EEEAE0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#AA8D54] rounded-full transition-all duration-500"
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 pt-5 border-t border-[#E8E2D5] flex items-start gap-2">
                <Activity
                  size={17}
                  className="text-[#AA8D54] mt-0.5 shrink-0"
                />

                <p className="text-xs text-[#77736A] leading-5">
                  Evaluated using 239 held-out records. Metrics are preliminary;
                  the test set was inspected during model selection.
                </p>
              </div>
            </div>
          </section>
        </>
      ) : null}

      {/* Recent Assessment Activity */}

      <section className="bg-[#FBFAF6] border border-[#E8E2D5] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#292720]">
              Recent Assessment Activity
            </h3>
            <p className="text-xs text-[#8D887D] mt-1">
              Latest prediction records from the database
            </p>
          </div>

          <span className="text-xs text-[#78643D] bg-[#E9E0CD] px-3 py-2 rounded-lg">
            {recentPredictions.length} Recent Records
          </span>
        </div>

        {loading && recentPredictions.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#8D887D]">
            Loading assessment history...
          </div>
        ) : recentPredictions.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F0EDE5] text-[#AA8D54] flex items-center justify-center">
              <ClipboardCheck size={23} />
            </div>

            <h4 className="text-sm font-semibold text-[#292720] mt-4">
              No Assessment History
            </h4>

            <p className="text-xs text-[#8D887D] mt-2 max-w-sm leading-5">
              New predictions will appear here when assessments are submitted.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-5">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-[#E8E2D5]">
                  <th className="text-xs font-semibold text-[#8D887D] py-3 pr-4">
                    Assessment
                  </th>
                  <th className="text-xs font-semibold text-[#8D887D] py-3 pr-4">
                    Student Record
                  </th>
                  <th className="text-xs font-semibold text-[#8D887D] py-3 pr-4">
                    Risk Probability
                  </th>
                  <th className="text-xs font-semibold text-[#8D887D] py-3 pr-4">
                    Classification
                  </th>
                  <th className="text-xs font-semibold text-[#8D887D] py-3">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentPredictions.map((item) => (
                  <tr
                    key={item.prediction_id}
                    className="border-b border-[#EEEAE0] last:border-0"
                  >
                    <td className="py-4 pr-4 text-sm font-medium text-[#292720]">
                      #{item.prediction_id}
                    </td>

                    <td className="py-4 pr-4">
                      {item.student_record_id !== null ? (
                        <div>
                          <p className="text-sm font-medium text-[#292720]">
                            {item.student_name || "Unknown Participant"}
                          </p>
                          <p className="text-xs text-[#8D887D] mt-1">
                            ID: {item.student_id || "Unavailable"}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-[#292720]">
                            Standalone Assessment
                          </p>
                          <p className="text-xs text-[#8D887D] mt-1">
                            Not linked to a student record
                          </p>
                        </div>
                      )}
                    </td>

                    <td className="py-4 pr-4 text-sm font-semibold text-[#292720]">
                      {(item.risk_probability * 100).toFixed(2)}%
                    </td>

                    <td className="py-4 pr-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-lg text-xs font-medium ${item.prediction === "At Risk"
                          ? "bg-[#F3E3DE] text-[#B96556]"
                          : "bg-[#E3EBE2] text-[#66836A]"
                          }`}
                      >
                        {item.prediction}
                      </span>
                    </td>

                    <td className="py-4 text-xs text-[#8D887D]">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        {formatDate(item.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer */}

      <footer className="flex items-center justify-between flex-wrap gap-3 pb-3">
        <p className="text-xs text-[#8D887D]">
          EduMonitor · Academic Intelligence Prototype
        </p>

        <p className="text-xs text-[#8D887D]">
          Target Definition: Current CGPA Below 2.5
        </p>
      </footer>

    </div>
  );
}
