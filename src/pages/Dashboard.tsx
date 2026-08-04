import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Eye,
  Filter,
  X,
  XCircle,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Hardcoded demo data (stand-in for API responses) ─────────────────────

const DEPARTMENTS = [
  { id: "d1", name: "Computer Science" },
  { id: "d2", name: "Mechanical" },
  { id: "d3", name: "Electronics" },
];

const COURSES = [
  { id: "c1", name: "B.E." },
  { id: "c2", name: "B.Tech" },
  { id: "c3", name: "M.E." },
];

const BATCHES = [
  { id: "b1", name: "2023-2027" },
  { id: "b2", name: "2022-2026" },
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
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const MALE_STUDENTS = [
  {
    id: "1",
    name: "Arjun",
    register_number: "21CS045",
    department_name: "Computer Science",
    course_name: "B.E.",
    batch_name: "2023-2027",
  },
  {
    id: "2",
    name: "Vikram",
    register_number: "21CS012",
    department_name: "Computer Science",
    course_name: "B.E.",
    batch_name: "2023-2027",
  },
  {
    id: "3",
    name: "Rahul",
    register_number: "20ME089",
    department_name: "Mechanical",
    course_name: "B.Tech",
    batch_name: "2022-2026",
  },
  {
    id: "4",
    name: "Karthik",
    register_number: "21EC034",
    department_name: "Electronics",
    course_name: "B.E.",
    batch_name: "2023-2027",
  },
];

const FEMALE_STUDENTS = [
  {
    id: "5",
    name: "Priya",
    register_number: "21CS021",
    department_name: "Computer Science",
    course_name: "B.E.",
    batch_name: "2023-2027",
  },
  {
    id: "6",
    name: "Sneha",
    register_number: "20ME055",
    department_name: "Mechanical",
    course_name: "B.Tech",
    batch_name: "2022-2026",
  },
  {
    id: "7",
    name: "Divya",
    register_number: "21EC019",
    department_name: "Electronics",
    course_name: "M.E.",
    batch_name: "2023-2027",
  },
];

const COUNTS = {
  total: {
    total_students: 312,
    total_present_students: 278,
    total_absent_students: 34,
  },
  Male: { gender_students: 178, present_students: 160, absent_students: 18 },
  Female: { gender_students: 134, present_students: 118, absent_students: 16 },
};

const DETAIL_HISTORY = [
  { asset_no: "LAP-1042", type: "out", time: "08:15:00" },
  { asset_no: "LAP-1042", type: "in", time: "12:40:00" },
  { asset_no: "PROJ-0231", type: "out", time: "13:05:00" },
  { asset_no: "PROJ-0231", type: "in", time: "15:20:00" },
];

// ─── Small building blocks ─────────────────────────────────────────────

// FIX: was a horizontal `justify-between` row with a fixed-width value
// badge — on narrow (mobile-S, ~320px) screens the label text had nowhere
// to shrink to and pushed the badge outside the card. Now it's a compact
// vertical stack: icon+label on top (which can wrap safely), value badge
// below. `min-w-0` + `break-words` on the text stop it from ever forcing
// the parent wider than its grid cell.
function CountCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-blue-700 rounded-2xl p-2.5 sm:p-4 text-white flex flex-col gap-2 min-w-0 overflow-hidden">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">
          {icon}
        </span>
        <p className="font-bold uppercase text-[9px] sm:text-[11px] leading-tight break-words min-w-0">
          {label}
        </p>
      </div>
      <div className="bg-white rounded-xl px-2.5 py-1 text-center self-start max-w-full">
        <p className="text-blue-700 font-bold text-sm sm:text-lg leading-none truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 max-w-full">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
      <span className="truncate">
        {label}: {value}
      </span>
    </span>
  );
}

export default function Dashboard() {
  const REFRESH_TIME = 3 * 60;

  const [appliedFilters, setAppliedFilters] = useState({
    department_id: "",
    course_id: "",
    batch_id: "",
  });
  const navigate = useNavigate();
  const [pendingFilters, setPendingFilters] = useState(appliedFilters);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const [gender, setGender] = useState("Male");
  const [search, setSearch] = useState("");
  const [countdown, setCountdown] = useState(REFRESH_TIME);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_TIME : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const applyFilters = () => {
    setAppliedFilters(pendingFilters);
    setShowFilterSheet(false);
  };

  const clearFilters = () => {
    const cleared = { department_id: "", course_id: "", batch_id: "" };
    setPendingFilters(cleared);
    setAppliedFilters(cleared);
    setShowFilterSheet(false);
  };

  const handleViewDetail = (student: any) => {
    setSelectedStudent(student);
    setShowDetail(true);
  };

  const activeList = gender === "Male" ? MALE_STUDENTS : FEMALE_STUDENTS;
  const activeCount = COUNTS[gender as "Male" | "Female"];

  const filteredStudents = activeList.filter((s) => {
    const t = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(t) ||
      s.register_number.toLowerCase().includes(t) ||
      s.department_name.toLowerCase().includes(t) ||
      s.course_name.toLowerCase().includes(t) ||
      s.batch_name.toLowerCase().includes(t)
    );
  });

  const appliedDeptLabel = appliedFilters.department_id
    ? (DEPARTMENTS.find((d) => d.id === appliedFilters.department_id)?.name ??
      "")
    : "";
  const appliedCourseLabel = appliedFilters.course_id
    ? (COURSES.find((c) => c.id === appliedFilters.course_id)?.name ?? "")
    : "";
  const appliedBatchLabel = appliedFilters.batch_id
    ? (BATCHES.find((b) => b.id === appliedFilters.batch_id)?.name ?? "")
    : "";
  const hasActiveFilters = !!(
    appliedDeptLabel ||
    appliedCourseLabel ||
    appliedBatchLabel
  );

  const selectCls =
    "w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none " +
    "focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white text-sm";

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen px-4 pt-6 pb-10 overflow-x-hidden">
      {/* Header */}
      <div className="bg-blue-800 rounded-2xl p-5 text-white flex items-start justify-between mb-5 gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">Welcome back</h1>
          <p className="text-blue-300 mt-1">Security Admin</p>
        </div>
        <div className="bg-white/10 rounded-xl px-3 py-2 text-center shrink-0">
          <p className="text-xs text-blue-200">Refresh in</p>
          <p className="font-bold text-sm">{countdown}s</p>
        </div>
      </div>

      {/* Total count cards */}
      {/* FIX: `flex flex-wrap` + `min-w-[47%]` doesn't subtract the gap,
          so 2-per-row math breaks on very narrow screens. A 3-col grid
          computes widths correctly and never overflows. */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <CountCard
          label="Total Students"
          value={COUNTS.total.total_students}
          icon={<Users />}
        />
        <CountCard
          label="Total Present"
          value={COUNTS.total.total_present_students}
          icon={<UserCheck />}
        />
        <CountCard
          label="Total Absent"
          value={COUNTS.total.total_absent_students}
          icon={<UserX />}
        />
      </div>

      {/* Filter trigger + applied chips */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-xl font-bold">Students</h2>
        <button
          type="button"
          onClick={() => {
            setPendingFilters(appliedFilters);
            setShowFilterSheet(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium shrink-0"
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {appliedDeptLabel && (
            <FilterChip label="Dept" value={appliedDeptLabel} />
          )}
          {appliedCourseLabel && (
            <FilterChip label="Course" value={appliedCourseLabel} />
          )}
          {appliedBatchLabel && (
            <FilterChip label="Batch" value={appliedBatchLabel} />
          )}
        </div>
      )}

      {/* Gender segmented control */}
      <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-xl p-1 mb-4">
        <button
          type="button"
          onClick={() => setGender("Male")}
          className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
            gender === "Male" ? "bg-blue-700 text-white" : "text-gray-600"
          }`}
        >
          Boys
        </button>
        <button
          type="button"
          onClick={() => setGender("Female")}
          className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
            gender === "Female" ? "bg-blue-700 text-white" : "text-gray-600"
          }`}
        >
          Girls
        </button>
      </div>

      {/* Gender-specific counts */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <CountCard
          label={gender === "Male" ? "Total Boys" : "Total Girls"}
          value={activeCount.gender_students}
          icon={<Users />}
        />
        <CountCard
          label="Present"
          value={activeCount.present_students}
          icon={<UserCheck />}
        />
        <CountCard
          label="Absent"
          value={activeCount.absent_students}
          icon={<UserX />}
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name, reg no, dept..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Student list */}
      <div className="space-y-3">
        {filteredStudents.map((stu) => (
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
              <p className="font-semibold text-gray-900 truncate">{stu.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {stu.register_number}
              </p>
              <p className="text-xs text-blue-600 truncate">
                {[stu.department_name, stu.course_name, stu.batch_name]
                  .filter(Boolean)
                  .join(" - ")}
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

        {filteredStudents.length === 0 && (
          <p className="text-gray-500 text-center py-8">No students found.</p>
        )}
      </div>

      {/* ── Filter bottom sheet ── */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Filter Students</h3>
              <button
                onClick={() => setShowFilterSheet(false)}
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  className={selectCls}
                  value={pendingFilters.department_id}
                  onChange={(e) =>
                    setPendingFilters((p) => ({
                      ...p,
                      department_id: e.target.value,
                    }))
                  }
                >
                  <option value="">All Department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  className={selectCls}
                  value={pendingFilters.course_id}
                  onChange={(e) =>
                    setPendingFilters((p) => ({
                      ...p,
                      course_id: e.target.value,
                    }))
                  }
                >
                  <option value="">All Course</option>
                  {COURSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                <select
                  className={selectCls}
                  value={pendingFilters.batch_id}
                  onChange={(e) =>
                    setPendingFilters((p) => ({
                      ...p,
                      batch_id: e.target.value,
                    }))
                  }
                >
                  <option value="">All Batch</option>
                  {BATCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={applyFilters}
                className="flex-1 py-3 bg-blue-700 text-white rounded-xl font-semibold text-sm"
              >
                Apply Filter
              </button>
              <button
                onClick={clearFilters}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Student detail bottom sheet ── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-xl ${avatarColor(selectedStudent?.name ?? "S")} text-white flex items-center justify-center font-bold shrink-0`}
                >
                  {initials(selectedStudent?.name ?? "S")}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {selectedStudent?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {[
                      selectedStudent?.register_number,
                      selectedStudent?.department_name,
                      selectedStudent?.batch_name,
                    ]
                      .filter(Boolean)
                      .join(" - ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                aria-label="Close"
                className="shrink-0"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {DETAIL_HISTORY.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {d.asset_no}
                      </p>
                      <p className="text-xs text-gray-500">
                        {d.time.slice(0, 5)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                        d.type === "in"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {d.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => setShowDetail(false)}
                className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
