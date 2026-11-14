
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Users
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

import { api, type AnalyticsSummary } from "../services/api";
import {
  EmptyState,
  ErrorState,
  LoadingState
} from "../components/PageState";
import {
  MetricCard,
  PageHeading,
  Panel,
  RiskPill
} from "../components/Ui";

const COLORS = ["#72947B", "#C87567"];

export default function Analytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Fetch analytics data from the backend
  const load = useCallback(async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = await api.getAnalytics();
      setData(result);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load analytics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and automatic updates from other pages
  useEffect(() => {
    void load();

    const handleDataUpdate = () => {
      void load(true);
    };

    window.addEventListener(
      "edumonitor:data-updated",
      handleDataUpdate
    );

    return () => {
      window.removeEventListener(
        "edumonitor:data-updated",
        handleDataUpdate
      );
    };
  }, [load]);

  const interventionItems = data
    ? [
        {
          label: "Pending",
          value: data.intervention_summary.pending,
          color: "#C87567"
        },
        {
          label: "In Progress",
          value: data.intervention_summary.in_progress,
          color: "#AA8D54"
        },
        {
          label: "Resolved",
          value: data.intervention_summary.resolved,
          color: "#72947B"
        }
      ]
    : [];

  const totalInterventions = interventionItems.reduce(
    (total, item) => total + item.value,
    0
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-7 p-6 lg:p-8">

      {/* Page Heading */}

      <PageHeading
        eyebrow="Insights & Reporting"
        title="Analytics"
        description="Monitor academic risk distribution, model evaluation and intervention activity."
        action={
          <button
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2D5] bg-[#FBFAF6] px-4 py-2.5 text-xs font-medium text-[#655F53] transition hover:bg-[#F0EDE5] disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh data"}
          </button>
        }
      />

      {/* Loading, Error and Empty States */}

      {loading ? (
        <LoadingState label="Loading analytics from FastAPI..." />
      ) : error && !data ? (
        <ErrorState
          message={error}
          onRetry={() => void load()}
        />
      ) : !data ? (
        <EmptyState
          title="Analytics unavailable"
          description="The backend returned no analytics summary."
        />
      ) : (
        <>

          {/* Background Refresh Error */}

          {error && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E7C8C1] bg-[#FBF0ED] p-4">
              <p className="text-xs text-[#8F493D]">
                Unable to refresh the latest analytics data. Showing the last successfully loaded results.
              </p>

              <button
                onClick={() => void load(true)}
                className="shrink-0 text-xs font-semibold text-[#8F493D] underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* KPI Cards */}

          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <MetricCard
              title="Total Students"
              value={data.total_students}
              description="Student records in database"
              icon={Users}
            />

            <MetricCard
              title="At Risk"
              value={data.at_risk}
              description="Currently classified at risk"
              icon={AlertTriangle}
              tone="red"
            />

            <MetricCard
              title="Not at Risk"
              value={data.not_at_risk}
              description="Currently classified not at risk"
              icon={ShieldCheck}
              tone="green"
            />

            <MetricCard
              title="Risk Percentage"
              value={`${data.risk_percentage.toFixed(2)}%`}
              description="Share of records at risk"
              icon={Activity}
            />

          </section>

          {/* Risk Distribution and Model Evaluation */}

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

            {/* Academic Risk Distribution */}

            <Panel
              title="Academic Risk Distribution"
              subtitle="Counts returned by the backend database"
            >
              {data.risk_distribution.length === 0 ? (
                <EmptyState
                  title="No risk distribution yet"
                  description="Run student assessments to populate this chart."
                />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.risk_distribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={78}
                        outerRadius={112}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {data.risk_distribution.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.name === "At Risk"
                                ? COLORS[1]
                                : COLORS[0]
                            }
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          background: "#FBFAF6",
                          border: "1px solid #E8E2D5",
                          borderRadius: 12
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            {/* Model Evaluation */}

            <Panel
              title="Model Evaluation"
              subtitle="Evaluation metrics supplied by the trained model service"
            >
              <div className="space-y-5">
                {Object.entries({
                  Accuracy: data.model_metrics.accuracy,
                  Precision: data.model_metrics.precision,
                  Recall: data.model_metrics.recall,
                  "F1 Score": data.model_metrics.f1_score,
                  "Balanced Accuracy": data.model_metrics.balanced_accuracy,
                  "PR-AUC": data.model_metrics.pr_auc
                }).map(([label, raw]) => {
                  const value = raw <= 1 ? raw * 100 : raw;

                  return (
                    <div key={label}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-[#655F53]">
                          {label}
                        </span>

                        <strong className="text-[#292720]">
                          {value.toFixed(2)}%
                        </strong>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#EEEAE0]">
                        <div
                          className="h-full rounded-full bg-[#AA8D54] transition-all duration-500"
                          style={{
                            width: `${Math.max(0, Math.min(100, value))}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 border-t border-[#E8E2D5] pt-4 text-xs leading-5 text-[#8D887D]">
                Model metrics describe the saved model's evaluation.
                They are not live performance measurements from each
                student record.
              </p>
            </Panel>

          </section>

          {/* Intervention Overview */}

          <Panel
            title="Intervention Overview"
            subtitle="Current intervention workflow status"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {interventionItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-[#F5F2EA] p-4"
                >
                  <p className="text-xs text-[#77736A]">
                    {item.label}
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-[#292720]">
                    {item.value}
                  </p>

                  <div className="mt-3 h-1.5 rounded-full bg-[#E8E2D5]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          totalInterventions > 0
                            ? (item.value / totalInterventions) * 100
                            : 0
                        }%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Recent Assessments */}

          <Panel
            title="Recent Assessments"
            subtitle="Latest predictions recorded by the API"
          >
            {data.recent_assessments.length === 0 ? (
              <EmptyState
                title="No assessments recorded"
                description="Predictions submitted through Risk Assessment will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">

                  <thead className="bg-[#F5F2EA] text-xs text-[#77736A]">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Classification</th>
                      <th className="px-4 py-3">Risk Probability</th>
                      <th className="px-4 py-3">Assessed At</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EEEAE0]">
                    {data.recent_assessments.map((assessment) => (
                      <tr key={assessment.id}>

                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-[#292720]">
                            {assessment.student_name}
                          </p>

                          <p className="text-xs text-[#8D887D]">
                            {assessment.student_id}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <RiskPill risk={assessment.prediction} />
                        </td>

                        <td className="px-4 py-4 text-sm text-[#655F53]">
                          {(assessment.risk_probability * 100).toFixed(2)}%
                        </td>

                        <td className="px-4 py-4 text-xs text-[#8D887D]">
                          {new Date(assessment.assessed_at).toLocaleString("en-IN")}
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}
          </Panel>

          {/* Last Refresh Information */}

          <div className="flex items-center justify-between gap-3 border-t border-[#E8E2D5] pt-4">
            <p className="text-xs text-[#8D887D]">
              EduMonitor · Academic Intelligence Prototype
            </p>

            <p className="text-xs text-[#8D887D]">
              {refreshing ? "Updating analytics..." : "Data synchronized"}
            </p>
          </div>

        </>
      )}
    </div>
  );
}
