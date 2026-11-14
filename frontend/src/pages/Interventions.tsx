import { useCallback, useEffect, useState } from "react";
import { HeartHandshake, Plus, RefreshCw, Save } from "lucide-react";
import { api, type Intervention, type Student } from "../services/api";
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";
import { PageHeading, Panel } from "../components/Ui";

const statuses = ["All", "Pending", "In Progress", "Resolved"];

export default function Interventions() {
  const [items, setItems] = useState<Intervention[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ student_id: "", student_name: "", issue: "", action: "", assigned_to: "", status: "Pending" as Intervention["status"], due_date: "" });
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const result = await api.getInterventions(filter); setItems(result.items); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load interventions."); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => {
    load();

    const handleDataUpdate = () => {
      load();
    };

    window.addEventListener("edumonitor:data-updated", handleDataUpdate);

    return () => {
      window.removeEventListener("edumonitor:data-updated", handleDataUpdate);
    };
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.createIntervention({ ...form, due_date: form.due_date || null });
      window.dispatchEvent(new Event("edumonitor:data-updated"));
      setForm({ student_id: "", student_name: "", issue: "", action: "", assigned_to: "", status: "Pending", due_date: "" });
      setShowForm(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create intervention."); }
    finally { setSaving(false); }
  }

  async function changeStatus(item: Intervention, status: Intervention["status"]) {
    try { await api.updateIntervention(item.id, { status }); await load(); window.dispatchEvent(new Event("edumonitor:data-updated")); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update intervention."); }
  }

  const count = (status: string) => items.filter(i => i.status === status).length;

  useEffect(() => {
    if (!studentSearch.trim() || selectedStudent) {
      setStudentResults([]);
      return;
    }

    let active = true;

    async function searchStudents() {
      setSearchingStudents(true);

      try {
        const result = await api.getStudents({
          search: studentSearch.trim(),
          page: 1,
          page_size: 8
        });

        if (active) {
          setStudentResults(result.students);
        }
      } catch {
        if (active) setStudentResults([]);
      } finally {
        if (active) setSearchingStudents(false);
      }
    }

    void searchStudents();

    return () => {
      active = false;
    };
  }, [studentSearch, selectedStudent]);


  return (
    <div className="mx-auto max-w-[1500px] space-y-7 p-6 lg:p-8">

      <PageHeading
        eyebrow="Student Support"
        title="Interventions"
        description="Record, assign and track follow-up actions for students who need support."
        action={
          <div className="flex gap-2">
            <button
              onClick={load}
              className="rounded-xl border border-[#E8E2D5] bg-[#FBFAF6] p-3 text-[#655F53]"
            >
              <RefreshCw size={16} />
            </button>

            <button
              onClick={() => setShowForm(v => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#AA8D54] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#967A43]"
            >
              <Plus size={15} />
              New Intervention
            </button>
          </div>
        }
      />

      {/* Status Summary */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {(["Pending", "In Progress", "Resolved"] as const).map(s => (
          <div
            key={s}
            className="rounded-2xl border border-[#E8E2D5] bg-[#FBFAF6] p-5"
          >
            <p className="text-sm text-[#77736A]">{s}</p>

            <p className="mt-3 text-3xl font-semibold text-[#292720]">
              {count(s)}
            </p>

            <p className="mt-1 text-xs text-[#8D887D]">
              In current results
            </p>
          </div>
        ))}
      </div>

      {/* Create Intervention Form */}

      {showForm && (
        <Panel
          title="Create Intervention"
          subtitle="Select a registered student and create an academic support action."
        >
          <form onSubmit={create} className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* Student Search */}

            <div className="relative md:col-span-2">
              <label className="mb-2 block text-xs font-medium text-[#655F53]">
                Search student by name or ID
              </label>

              <input
                value={studentSearch}
                onChange={e => {
                  setStudentSearch(e.target.value);
                  setSelectedStudent(null);
                  setForm(f => ({
                    ...f,
                    student_id: "",
                    student_name: ""
                  }));
                }}
                placeholder="Enter student name or 8-digit ID..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#F5F2EA] px-3 py-3 text-sm outline-none focus:border-[#AA8D54]"
              />

              {searchingStudents && (
                <p className="mt-2 text-xs text-[#8D887D]">
                  Searching students...
                </p>
              )}

              {studentResults.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#E8E2D5] bg-[#FBFAF6] shadow-lg">
                  {studentResults.map(student => (
                    <button
                      type="button"
                      key={student.id}
                      onClick={() => {
                        setSelectedStudent(student);

                        setStudentSearch(
                          `${student.name} (${student.student_id})`
                        );

                        setForm(f => ({
                          ...f,
                          student_id: student.student_id,
                          student_name: student.name
                        }));

                        setStudentResults([]);
                      }}
                      className="w-full border-b border-[#EEEAE0] px-4 py-3 text-left hover:bg-[#F0EDE5]"
                    >
                      <p className="text-sm font-medium text-[#292720]">
                        {student.name}
                      </p>

                      <p className="mt-1 text-xs text-[#8D887D]">
                        {student.student_id} · Semester {student.current_semester}
                      </p>

                      {student.risk_status && (
                        <p className={`mt-1 text-xs ${student.risk_status === "At Risk"
                          ? "text-[#B96556]"
                          : "text-[#66836A]"
                          }`}>
                          {student.risk_status}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!searchingStudents &&
                studentSearch.trim().length > 0 &&
                !selectedStudent &&
                studentResults.length === 0 && (
                  <p className="mt-2 text-xs text-[#8D887D]">
                    No matching students found. Try another name or ID.
                  </p>
                )}

              {selectedStudent && (
                <div className="mt-3 rounded-xl border border-[#DCE6D9] bg-[#EDF3EB] p-3">
                  <p className="text-xs font-semibold text-[#55765A]">
                    <span className="mr-2">✓</span>
                    Student selected
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#292720]">
                    {selectedStudent.name}
                  </p>

                  <p className="mt-1 text-xs text-[#77736A]">
                    ID: {selectedStudent.student_id} · Semester {selectedStudent.current_semester}
                  </p>
                </div>
              )}
            </div>

            {/* Identified Issue */}

            <Field
              label="Identified issue"
              value={form.issue}
              onChange={v => setForm(f => ({ ...f, issue: v }))}
              required
            />

            {/* Intervention Action */}

            <Field
              label="Intervention action"
              value={form.action}
              onChange={v => setForm(f => ({ ...f, action: v }))}
              required
            />

            {/* Assigned Person */}

            <Field
              label="Assigned to"
              value={form.assigned_to}
              onChange={v => setForm(f => ({ ...f, assigned_to: v }))}
              required
            />

            {/* Due Date */}

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[#655F53]">
                Due date
              </span>

              <input
                type="date"
                value={form.due_date}
                onChange={e =>
                  setForm(f => ({ ...f, due_date: e.target.value }))
                }
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#F5F2EA] px-3 py-3 text-sm outline-none focus:border-[#AA8D54]"
              />
            </label>

            {/* Form Error */}

            {error && (
              <div className="md:col-span-2 rounded-xl border border-[#E7C8C1] bg-[#FBF0ED] p-3 text-xs text-[#A8584C]">
                {error}
              </div>
            )}

            {/* Form Actions */}

            <div className="md:col-span-2 flex justify-end gap-2">

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedStudent(null);
                  setStudentSearch("");
                  setStudentResults([]);
                  setError("");
                }}
                className="rounded-xl border border-[#E8E2D5] px-4 py-2.5 text-xs text-[#655F53]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || !selectedStudent}
                className="inline-flex items-center gap-2 rounded-xl bg-[#AA8D54] px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Intervention"}
              </button>

            </div>
          </form>
        </Panel>
      )}

      {/* Intervention Tracker */}

      <Panel
        title="Intervention Tracker"
        subtitle="Track ownership, due dates and completion status."
      >

        {/* Status Filters */}

        <div className="mb-5 flex flex-wrap gap-2">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${filter === s
                ? "bg-[#292824] text-white"
                : "bg-[#F0EDE5] text-[#655F53] hover:bg-[#E9E0CD]"
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Loading / Error / Empty / Data */}

        {loading ? (
          <LoadingState label="Loading intervention records..." />
        ) : error && !showForm ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No interventions found"
            description="Create an intervention when a student needs academic support, or change the status filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">

              <thead className="bg-[#F5F2EA] text-xs text-[#77736A]">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Issue / Action</th>
                  <th className="px-4 py-3">Assigned to</th>
                  <th className="px-4 py-3">Due date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Update</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EEEAE0]">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-[#F8F6F0]">

                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-[#292720]">
                        {item.student_name}
                      </p>

                      <p className="text-xs text-[#8D887D]">
                        {item.student_id}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-xs font-medium text-[#655F53]">
                        {item.issue}
                      </p>

                      <p className="mt-1 max-w-xs text-xs text-[#8D887D]">
                        {item.action}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-xs text-[#655F53]">
                      {item.assigned_to}
                    </td>

                    <td className="px-4 py-4 text-xs text-[#655F53]">
                      {item.due_date || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={item.status}
                        onChange={e =>
                          void changeStatus(
                            item,
                            e.target.value as Intervention["status"]
                          )
                        }
                        className="rounded-lg border border-[#E8E2D5] bg-[#F5F2EA] px-2 py-2 text-xs text-[#655F53]"
                      >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                      </select>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </Panel>

      {/* Footer */}

      <div className="flex items-center gap-2 text-xs text-[#8D887D]">
        <HeartHandshake size={15} className="text-[#AA8D54]" />
        Intervention records are stored in the application database and linked to registered student records.
      </div>

    </div>
  );

}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium text-[#655F53]">{label}</span><input required={required} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-[#E8E2D5] bg-[#F5F2EA] px-3 py-3 text-sm outline-none focus:border-[#AA8D54]" /></label>;
}
function StatusBadge({ status }: { status: Intervention["status"] }) {
  const style = status === "Resolved" ? "bg-[#E4ECE3] text-[#55765A]" : status === "In Progress" ? "bg-[#EEE7D8] text-[#806A3E]" : "bg-[#F3E3DE] text-[#A8584C]";
  return <span className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${style}`}>{status}</span>;
}
