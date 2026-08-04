import { useState } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { Users, UserCheck, UserX, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Types ──────────────────────────────────────────────────────────────

interface StudentReportItem {
  id: string;
  name: string;
  register_number: string;
  department_name: string;
  course_name: string;
  batch_name: string;
  status: "Present" | "Absent";
  last_activity: string; // "YYYY-MM-DD HH:mm:ss"
}

// ─── Hardcoded demo data (swap for a real API call later) ─────────────────
// TODO: replace with fetchStudentReportByRange(startDate, endDate) once the
// backend endpoint is ready — same shape as fetchDashboardAnimalCountByRange.

const MOCK_STUDENTS: StudentReportItem[] = [
  {
    id: "1",
    name: "Arjun",
    register_number: "21CS045",
    department_name: "Computer Science",
    course_name: "B.E.",
    batch_name: "2023-2027",
    status: "Present",
    last_activity: "2026-08-04 08:15:00",
  },
  {
    id: "2",
    name: "Vikram",
    register_number: "21CS012",
    department_name: "Computer Science",
    course_name: "B.E.",
    batch_name: "2023-2027",
    status: "Present",
    last_activity: "2026-08-04 08:22:00",
  },
  {
    id: "3",
    name: "Rahul",
    register_number: "20ME089",
    department_name: "Mechanical",
    course_name: "B.Tech",
    batch_name: "2022-2026",
    status: "Absent",
    last_activity: "2026-08-03 17:40:00",
  },
  {
    id: "4",
    name: "Karthik",
    register_number: "21EC034",
    department_name: "Electronics",
    course_name: "B.E.",
    batch_name: "2023-2027",
    status: "Present",
    last_activity: "2026-08-04 09:05:00",
  },
  {
    id: "5",
    name: "Priya",
    register_number: "21CS021",
    department_name: "Computer Science",
    course_name: "B.E.",
    batch_name: "2023-2027",
    status: "Present",
    last_activity: "2026-08-04 08:30:00",
  },
  {
    id: "6",
    name: "Sneha",
    register_number: "20ME055",
    department_name: "Mechanical",
    course_name: "B.Tech",
    batch_name: "2022-2026",
    status: "Absent",
    last_activity: "2026-08-02 16:10:00",
  },
  {
    id: "7",
    name: "Divya",
    register_number: "21EC019",
    department_name: "Electronics",
    course_name: "M.E.",
    batch_name: "2023-2027",
    status: "Present",
    last_activity: "2026-08-04 08:50:00",
  },
];

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatCreatedOn(createdOn: string): string {
  // Backend sends "YYYY-MM-DD HH:mm:ss" — parse manually since browsers
  // (Safari in particular) don't reliably parse space-separated datetimes.
  const [datePart, timePart] = createdOn.split(" ");
  if (!datePart || !timePart) return createdOn;

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hour, minute, second ?? 0);

  if (isNaN(date.getTime())) return createdOn;

  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date
    .toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();

  return `${formattedDate}, ${formattedTime}`;
}

// Defaults: today for end date, 7 days ago for start date — adjust if you'd
// rather default to empty inputs.
function getDefaultDates() {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  const toISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    start: toISODate(weekAgo),
    end: toISODate(today),
  };
}

// ─── Count card (same look as StudentDashboard, now mobile-safe) ──────────
// FIX: this card had no `min-w-0` / `break-words` / `truncate` anywhere, and
// used fixed (non-responsive) padding + icon size. On mobile-S (~320px) a
// 2-column grid row (e.g. "Present" / "Absent" side by side) only leaves
// ~130px per card — a long label or a big number (e.g. "1,024") could push
// past the white value badge's rounded corners or wrap awkwardly against
// the card edge. Matched this to the same defensive pattern used in the
// dashboard's CountCard: shrink-0 icon, min-w-0 + break-words label,
// truncate + max-w-full on the value badge, responsive padding/text sizes.
function CountCard({
  label,
  value,
  icon,
  wide = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`bg-blue-700 rounded-2xl p-3 sm:p-4 text-white min-w-0 overflow-hidden ${
        wide ? "col-span-2" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 min-w-0">
        <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">
          {icon}
        </span>
        <p className="font-bold uppercase text-[10px] sm:text-[11px] leading-tight break-words min-w-0">
          {label}
        </p>
      </div>
      <div className="bg-white rounded-xl px-3 py-1.5 inline-block max-w-full">
        <p className="text-blue-700 font-bold text-base sm:text-lg leading-none truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function Reports() {
  const navigate = useNavigate();
  const defaults = getDefaultDates();

  const [dateRange, setDateRange] = useState<Date[]>([
    new Date(defaults.start),
    new Date(defaults.end),
  ]);

  // Derived YYYY-MM-DD strings for the API call, kept in sync with dateRange.
  const toISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const startDate = dateRange[0] ? toISODate(dateRange[0]) : "";
  const endDate = dateRange[1] ? toISODate(dateRange[1]) : "";

  const [students, setStudents] = useState<StudentReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      setError("Please select both a start and end date.");
      return;
    }
    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      // TODO: swap for a real API call, e.g.
      // const data = await fetchStudentReportByRange(startDate, endDate);
      // setStudents(data.students);
      await new Promise((resolve) => setTimeout(resolve, 400)); // simulate network
      setStudents(MOCK_STUDENTS);
      setHasSearched(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load report data.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const totalStudents = students.length;
  const totalPresent = students.filter((s) => s.status === "Present").length;
  const totalAbsent = students.filter((s) => s.status === "Absent").length;

  return (
    <div className="px-4 pt-6 overflow-x-hidden max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      {/* Date range pickers */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mt-2 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Date Range
          </label>
          <Flatpickr
            options={{
              mode: "range",
              dateFormat: "Y-m-d",
              closeOnSelect: false,
              altInput: true,
              altFormat: "j F Y",
            }}
            value={dateRange}
            className="form-input w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onChange={(selectedDates) => {
              if (selectedDates.length === 2) {
                setDateRange(selectedDates);
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full mt-3 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-2.5 transition-colors"
        >
          {isLoading ? "Loading..." : "Search"}
        </button>
      </div>

      {/* Loading / error states */}
      {isLoading && (
        <p className="text-gray-500 text-center py-8">Loading report...</p>
      )}
      {error && !isLoading && (
        <p className="text-red-500 text-center py-4">{error}</p>
      )}

      {!isLoading && !error && hasSearched && (
        <>
          {/* Selected date range indicator */}
          <p className="text-gray-500 text-sm mb-4 break-words">
            Showing results for{" "}
            <span className="font-semibold text-gray-700">
              {new Date(startDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-700">
              {new Date(endDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>

          {/* Count cards — same look as the dashboard */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
            <CountCard
              label="Total Students"
              value={totalStudents}
              icon={<Users />}
              wide
            />
            <CountCard
              label="Present"
              value={totalPresent}
              icon={<UserCheck />}
            />
            <CountCard label="Absent" value={totalAbsent} icon={<UserX />} />
          </div>

          {/* Student list — same card style as StudentDashboard */}
          <h2 className="text-2xl font-bold mt-6 mb-3">Students</h2>
          <div className="space-y-3">
            {students.map((stu) => (
              <div
                key={stu.id}
                className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
              >
                <div
                  className={`w-14 h-14 rounded-xl ${avatarColor(stu.name)} text-white flex items-center justify-center font-bold shrink-0`}
                >
                  {initials(stu.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {stu.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {stu.register_number}
                  </p>
                  <p className="text-xs text-blue-600 truncate">
                    {[stu.department_name, stu.course_name, stu.batch_name]
                      .filter(Boolean)
                      .join(" - ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatCreatedOn(stu.last_activity)}
                  </p>
                  <p
                    className={`text-xs font-semibold mt-0.5 ${
                      stu.status === "Present"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stu.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/person/${stu.id}`)}
                  aria-label={`View ${stu.name}`}
                  className="inline-flex items-center justify-center !p-0 w-10 h-10 rounded-full bg-blue-50 text-blue-600 shrink-0"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            ))}

            {students.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No students for this range.
              </p>
            )}
          </div>
        </>
      )}

      {!hasSearched && !isLoading && !error && (
        <p className="text-gray-500 text-center py-8">
          Select a date range and tap Search to view the report.
        </p>
      )}
    </div>
  );
}
