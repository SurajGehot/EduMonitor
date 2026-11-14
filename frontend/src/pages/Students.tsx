
import { useCallback, useEffect, useState } from "react";
import {
    Search,
    Users,
    AlertTriangle,
    ShieldCheck,
    ChevronRight,
    RefreshCw,
    Activity,
    Database
} from "lucide-react";

import {
    api,
    type Student,
    type StudentDetails
} from "../services/api";

import {
    ErrorState,
    LoadingState,
    EmptyState
} from "../components/PageState";

import {
    MetricCard,
    PageHeading,
    Panel,
    RiskPill
} from "../components/Ui";

function getSourceLabel(source: string) {
    switch (source) {
        case "demonstration":
            return "Research Dataset";
        case "manual_demo":
            return "Manual Demo";
        default:
            return "Unclassified Record";
    }
}

export default function Students() {
    const [items, setItems] = useState<Student[]>([]);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState("");
    const [risk, setRisk] = useState("All");

    const [page, setPage] = useState(1);
    const pageSize = 50;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selected, setSelected] = useState<Student | null>(null);
    const [selectedDetails, setSelectedDetails] =
        useState<StudentDetails | null>(null);

    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await api.getStudents({
                search,
                risk,
                page,
                page_size: pageSize
            });

            setItems(result.students);
            setTotal(result.total);

            setSelected(current => {
                if (!current) return null;

                return result.students.find(
                    student => student.id === current.id
                ) ?? null;
            });

        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "Unable to load students."
            );
        } finally {
            setLoading(false);
        }
    }, [search, risk, page]);

    useEffect(() => {
        void load();
    }, [load]);

    const openStudentProfile = async (student: Student) => {
        setSelected(student);
        setSelectedDetails(null);
        setProfileError("");
        setProfileLoading(true);

        try {
            const details = await api.getStudent(student.id);
            setSelectedDetails(details);
        } catch (e) {
            setProfileError(
                e instanceof Error
                    ? e.message
                    : "Unable to load the complete student profile."
            );
        } finally {
            setProfileLoading(false);
        }
    };

    const closeProfile = () => {
        setSelected(null);
        setSelectedDetails(null);
        setProfileError("");
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleRiskChange = (value: string) => {
        setRisk(value);
        setPage(1);
    };

    const atRisk = items.filter(
        student => student.risk_status === "At Risk"
    ).length;

    const safe = items.filter(
        student => student.risk_status === "Not at Risk"
    ).length;

    const assessed = items.filter(
        student => student.risk_status !== null
    ).length;

    return (
        <div className="mx-auto max-w-[1600px] space-y-7 p-6 lg:p-8">

            <PageHeading
                eyebrow="Academic Records"
                title="Student Directory"
                description="Search student records and review academic risk classifications."
                action={
                    <button
                        onClick={load}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#E8E2D5] bg-[#FBFAF6] px-4 py-2.5 text-xs font-medium text-[#655F53] transition hover:bg-[#F0EDE5] disabled:opacity-50"
                    >
                        <RefreshCw
                            size={14}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                }
            />

            {/* Summary metrics */}
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                <MetricCard
                    title="Students in Results"
                    value={total}
                    description="Matching database records"
                    icon={Users}
                />

                <MetricCard
                    title="At Risk"
                    value={atRisk}
                    description="Among currently loaded records"
                    icon={AlertTriangle}
                    tone="red"
                />

                <MetricCard
                    title="Not at Risk"
                    value={safe}
                    description="Among currently loaded records"
                    icon={ShieldCheck}
                    tone="green"
                />

                <MetricCard
                    title="Assessed Records"
                    value={assessed}
                    description="Among currently loaded records"
                    icon={Activity}
                />

            </section>

            {/* Student records */}
            <Panel
                title="Student Records"
                subtitle="Search and review academic information and model-generated risk assessments."
            >

                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                    {/* Search */}
                    <div className="flex w-full items-center gap-2 rounded-xl border border-[#E8E2D5] bg-[#F5F2EA] px-3 py-2.5 transition focus-within:border-[#AA8D54] lg:max-w-sm">

                        <Search
                            size={17}
                            className="text-[#8D887D]"
                        />

                        <input
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            placeholder="Search student name or ID..."
                            className="w-full bg-transparent text-sm text-[#292720] outline-none placeholder:text-[#999387]"
                        />

                    </div>

                    {/* Risk filter */}
                    <select
                        value={risk}
                        onChange={e => handleRiskChange(e.target.value)}
                        className="rounded-xl border border-[#E8E2D5] bg-[#F5F2EA] px-3 py-2.5 text-sm text-[#655F53] outline-none focus:border-[#AA8D54]"
                    >
                        <option value="All">All Risk Levels</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Not at Risk">Not at Risk</option>
                        <option value="Not Assessed">Not Assessed</option>
                    </select>

                </div>

                {loading ? (
                    <LoadingState label="Loading student records..." />
                ) : error ? (
                    <ErrorState
                        message={error}
                        onRetry={load}
                    />
                ) : items.length === 0 ? (
                    <EmptyState
                        title="No student records found"
                        description="Try another search or change the selected risk level."
                    />
                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1050px] text-left">

                            <thead className="bg-[#F5F2EA] text-xs text-[#77736A]">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Student</th>
                                    <th className="px-4 py-3 font-semibold">Semester</th>
                                    <th className="px-4 py-3 font-semibold">Previous SGPA</th>
                                    <th className="px-4 py-3 font-semibold">Attendance</th>
                                    <th className="px-4 py-3 font-semibold">Risk Probability</th>
                                    <th className="px-4 py-3 font-semibold">Risk Status</th>
                                    <th className="px-4 py-3 text-right font-semibold">Profile</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#EEEAE0]">

                                {items.map(student => (

                                    <tr
                                        key={student.id}
                                        className="transition hover:bg-[#F8F5ED]"
                                    >

                                        {/* Student identity */}
                                        <td className="px-4 py-4">

                                            <p className="text-sm font-medium text-[#292720]">
                                                {student.name}
                                            </p>

                                            <p className="mt-0.5 text-xs font-medium tracking-wide text-[#8D887D]">
                                                {student.student_id}
                                            </p>

                                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#AA8D54]">
                                                <Database size={11} />
                                                {getSourceLabel(student.data_source)}
                                            </span>

                                        </td>

                                        {/* Semester */}
                                        <td className="px-4 py-4 text-sm text-[#655F53]">
                                            {student.current_semester}
                                        </td>

                                        {/* Previous SGPA */}
                                        <td className="px-4 py-4 text-sm text-[#655F53]">
                                            {student.previous_sgpa ?? "—"}
                                        </td>

                                        {/* Attendance */}
                                        <td className="px-4 py-4 text-sm text-[#655F53]">
                                            {student.attendance == null
                                                ? "—"
                                                : `${student.attendance}%`}
                                        </td>

                                        {/* Risk probability */}
                                        <td className="px-4 py-4">

                                            {student.risk_probability == null ? (

                                                <span className="text-sm text-[#8D887D]">
                                                    —
                                                </span>

                                            ) : (

                                                <div className="min-w-[105px]">

                                                    <p className="mb-1 text-sm font-semibold text-[#655F53]">
                                                        {(student.risk_probability * 100).toFixed(1)}%
                                                    </p>

                                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EAE5D9]">

                                                        <div
                                                            className={`h-full rounded-full ${
                                                                student.risk_status === "At Risk"
                                                                    ? "bg-[#B65D51]"
                                                                    : "bg-[#718C70]"
                                                            }`}
                                                            style={{
                                                                width: `${Math.min(
                                                                    100,
                                                                    Math.max(
                                                                        0,
                                                                        student.risk_probability * 100
                                                                    )
                                                                )}%`
                                                            }}
                                                        />

                                                    </div>

                                                </div>

                                            )}

                                        </td>

                                        {/* Risk classification */}
                                        <td className="px-4 py-4">
                                            <RiskPill risk={student.risk_status} />
                                        </td>

                                        {/* Profile action */}
                                        <td className="px-4 py-4 text-right">

                                            <button
                                                onClick={() => void openStudentProfile(student)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-[#92733D] transition hover:text-[#292720]"
                                            >
                                                View
                                                <ChevronRight size={14} />
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

                {/* Pagination */}
                {!loading && !error && items.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3 border-t border-[#EEEAE0] pt-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <p className="text-xs text-[#8D887D]">
                                Showing {(page - 1) * pageSize + 1}
                                {" – "}
                                {Math.min(page * pageSize, total)}
                                {" of "}
                                {total} students
                            </p>

                            <p className="mt-1 text-xs text-[#8D887D]">
                                Risk probabilities are model estimates
                            </p>
                        </div>

                        <div className="flex items-center gap-3">

                            <button
                                onClick={() => setPage(current => Math.max(1, current - 1))}
                                disabled={page === 1 || loading}
                                className="rounded-lg border border-[#E8E2D5] px-3 py-2 text-xs font-medium text-[#655F53] transition hover:bg-[#F0EDE5] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="text-xs text-[#655F53]">
                                Page {page} of {totalPages}
                            </span>

                            <button
                                onClick={() => setPage(current => current + 1)}
                                disabled={page >= totalPages || loading}
                                className="rounded-lg border border-[#E8E2D5] px-3 py-2 text-xs font-medium text-[#655F53] transition hover:bg-[#F0EDE5] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>

                        </div>

                    </div>
                )}

            </Panel>

            {/* Student profile modal */}
            {selected && (

                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
                    onClick={closeProfile}
                >

                    <div
                        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E8E2D5] bg-[#FBFAF6] p-6 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >

                        {/* Modal heading */}
                        <div className="mb-6 flex items-start justify-between">

                            <div>

                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#AA8D54]">
                                    Student Profile
                                </p>

                                <h2 className="text-lg font-semibold text-[#292720]">
                                    {selected.name}
                                </h2>

                                <p className="mt-1 text-xs font-medium tracking-wide text-[#8D887D]">
                                    {selected.student_id}
                                </p>

                                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#AA8D54]">
                                    <Database size={11} />
                                    {getSourceLabel(selected.data_source)}
                                </span>

                            </div>

                            <button
                                onClick={closeProfile}
                                className="rounded-lg px-3 py-1.5 text-xs text-[#8D887D] transition hover:bg-[#F0EDE5]"
                            >
                                Close
                            </button>

                        </div>

                        {profileLoading ? (
                            <LoadingState label="Loading complete student profile..." />
                        ) : profileError ? (
                            <ErrorState
                                message={profileError}
                                onRetry={() => void openStudentProfile(selected)}
                            />
                        ) : selectedDetails ? (

                            <div className="space-y-4">

                                {/* Academic information */}
                                <div className="rounded-xl border border-[#E8E2D5] bg-white/50 p-4">

                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#92733D]">
                                        Academic Information
                                    </p>

                                    <div className="space-y-3 text-sm text-[#655F53]">

                                        {[
                                            ["Current semester", selectedDetails.current_semester],
                                            ["Previous SGPA", selectedDetails.previous_sgpa],
                                            ["Current CGPA", selectedDetails.current_cgpa],
                                            ["Attendance", `${selectedDetails.attendance}%`],
                                            ["Completed credits", selectedDetails.completed_credits]
                                        ].map(([label, value]) => (
                                            <div key={String(label)} className="flex justify-between gap-3">
                                                <span>{label}</span>
                                                <strong className="text-right text-[#292720]">
                                                    {value ?? "Not available"}
                                                </strong>
                                            </div>
                                        ))}

                                    </div>

                                </div>

                                {/* Engagement information */}
                                <div className="rounded-xl border border-[#E8E2D5] bg-white/50 p-4">

                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#92733D]">
                                        Study & Engagement Information
                                    </p>

                                    <div className="space-y-3 text-sm text-[#655F53]">

                                        {[
                                            ["Daily study hours", selectedDetails.daily_study_hours],
                                            ["Study sessions per day", selectedDetails.study_sessions_per_day],
                                            ["Daily social media hours", selectedDetails.daily_social_media_hours],
                                            ["Teacher consultancy", selectedDetails.teacher_consultancy],
                                            ["Skill development hours", selectedDetails.daily_skill_development_hours],
                                            ["Co-curricular activities", selectedDetails.cocurricular_activities],
                                            ["Learning mode", selectedDetails.learning_mode],
                                            ["English proficiency", selectedDetails.english_proficiency]
                                        ].map(([label, value]) => (
                                            <div key={String(label)} className="flex justify-between gap-3">
                                                <span>{label}</span>
                                                <strong className="text-right text-[#292720]">
                                                    {value ?? "Not available"}
                                                </strong>
                                            </div>
                                        ))}

                                    </div>

                                </div>

                                {/* Risk assessment */}
                                <div className="rounded-xl border border-[#E8E2D5] bg-white/50 p-4">

                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#92733D]">
                                        Risk Assessment
                                    </p>

                                    <div className="space-y-3 text-sm text-[#655F53]">

                                        <div className="flex items-center justify-between gap-3">
                                            <span>Risk status</span>
                                            <RiskPill risk={selectedDetails.risk_status} />
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span>Risk probability</span>
                                            <strong className="text-[#292720]">
                                                {selectedDetails.risk_probability == null
                                                    ? "Not available"
                                                    : `${(selectedDetails.risk_probability * 100).toFixed(2)}%`}
                                            </strong>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span>Decision threshold</span>
                                            <strong className="text-[#292720]">
                                                {selectedDetails.decision_threshold == null
                                                    ? "Not available"
                                                    : `${(selectedDetails.decision_threshold * 100).toFixed(0)}%`}
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                                {/* Record information */}
                                <div className="rounded-xl border border-[#E8E2D5] bg-white/50 p-4">

                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#92733D]">
                                        Record Information
                                    </p>

                                    <div className="space-y-3 text-sm text-[#655F53]">

                                        <div className="flex justify-between gap-3">
                                            <span>Record source</span>
                                            <strong className="text-right text-[#292720]">
                                                {getSourceLabel(selectedDetails.data_source)}
                                            </strong>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span>Student ID</span>
                                            <strong className="text-[#292720]">
                                                {selectedDetails.student_id}
                                            </strong>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span>Database record ID</span>
                                            <strong className="text-[#292720]">
                                                {selectedDetails.id}
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                            </div>

                        ) : null}

                        <p className="mt-5 text-[11px] leading-relaxed text-[#8D887D]">
                            Risk probability is an estimate generated by the trained machine learning model.
                            It should be interpreted as decision-support information, not a verified academic outcome.
                        </p>

                    </div>

                </div>

            )}

        </div>
    );
}
