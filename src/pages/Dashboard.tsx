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
  { id: "d1", name: "Engineering" },
  { id: "d2", name: "Human Resources" },
  { id: "d3", name: "Sales & Marketing" },
];

const DESIGNATIONS = [
  { id: "c1", name: "Software Engineer" },
  { id: "c2", name: "Team Lead" },
  { id: "c3", name: "Manager" },
];

const SHIFTS = [
  { id: "b1", name: "Morning Shift" },
  { id: "b2", name: "Evening Shift" },
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

const MALE_EMPLOYEES = [
  {
    id: "1",
    name: "Arjun",
    employee_id: "EMP1045",
    department_name: "Engineering",
    designation_name: "Software Engineer",
    shift_name: "Morning Shift",
  },
  {
    id: "2",
    name: "Vikram",
    employee_id: "EMP1012",
    department_name: "Engineering",
    designation_name: "Team Lead",
    shift_name: "Morning Shift",
  },
  {
    id: "3",
    name: "Rahul",
    employee_id: "EMP2089",
    department_name: "Sales & Marketing",
    designation_name: "Manager",
    shift_name: "Evening Shift",
  },
  {
    id: "4",
    name: "Karthik",
    employee_id: "EMP3034",
    department_name: "Human Resources",
    designation_name: "Software Engineer",
    shift_name: "Morning Shift",
  },
];

const FEMALE_EMPLOYEES = [
  {
    id: "5",
    name: "Priya",
    employee_id: "EMP1021",
    department_name: "Engineering",
    designation_name: "Software Engineer",
    shift_name: "Morning Shift",
  },
  {
    id: "6",
    name: "Sneha",
    employee_id: "EMP2055",
    department_name: "Sales & Marketing",
    designation_name: "Manager",
    shift_name: "Evening Shift",
  },
  {
    id: "7",
    name: "Divya",
    employee_id: "EMP3019",
    department_name: "Human Resources",
    designation_name: "Team Lead",
    shift_name: "Morning Shift",
  },
];

const COUNTS = {
  total: {
    total_employees: 312,
    total_present_employees: 278,
    total_absent_employees: 34,
  },
  Male: {
    gender_employees: 178,
    present_employees: 160,
    absent_employees: 18,
  },
  Female: {
    gender_employees: 134,
    present_employees: 118,
    absent_employees: 16,
  },
};

const DETAIL_HISTORY = [
  { device: "Main Gate", type: "in", time: "09:02:00" },
  { device: "Cafeteria", type: "out", time: "13:10:00" },
  { device: "Cafeteria", type: "in", time: "13:45:00" },
  { device: "Main Gate", type: "out", time: "18:20:00" },
];

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
    designation_id: "",
    shift_id: "",
  });
  const navigate = useNavigate();
  const [pendingFilters, setPendingFilters] = useState(appliedFilters);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const [gender, setGender] = useState("Male");
  const [search, setSearch] = useState("");
  const [countdown, setCountdown] = useState(REFRESH_TIME);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

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
    const cleared = { department_id: "", designation_id: "", shift_id: "" };
    setPendingFilters(cleared);
    setAppliedFilters(cleared);
    setShowFilterSheet(false);
  };

  const handleViewDetail = (employee: any) => {
    setSelectedEmployee(employee);
    setShowDetail(true);
  };

  const activeList = gender === "Male" ? MALE_EMPLOYEES : FEMALE_EMPLOYEES;
  const activeCount = COUNTS[gender as "Male" | "Female"];

  const filteredEmployees = activeList.filter((e) => {
    const t = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(t) ||
      e.employee_id.toLowerCase().includes(t) ||
      e.department_name.toLowerCase().includes(t) ||
      e.designation_name.toLowerCase().includes(t) ||
      e.shift_name.toLowerCase().includes(t)
    );
  });

  const appliedDeptLabel = appliedFilters.department_id
    ? (DEPARTMENTS.find((d) => d.id === appliedFilters.department_id)?.name ??
      "")
    : "";
  const appliedDesignationLabel = appliedFilters.designation_id
    ? (DESIGNATIONS.find((c) => c.id === appliedFilters.designation_id)?.name ??
      "")
    : "";
  const appliedShiftLabel = appliedFilters.shift_id
    ? (SHIFTS.find((b) => b.id === appliedFilters.shift_id)?.name ?? "")
    : "";
  const hasActiveFilters = !!(
    appliedDeptLabel ||
    appliedDesignationLabel ||
    appliedShiftLabel
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
          <p className="text-blue-300 mt-1">HR Admin</p>
        </div>
        <div className="bg-white/10 rounded-xl px-3 py-2 text-center shrink-0">
          <p className="text-xs text-blue-200">Refresh in</p>
          <p className="font-bold text-sm">{countdown}s</p>
        </div>
      </div>

      {/* Total count cards */}

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <CountCard
          label="Total Employees"
          value={COUNTS.total.total_employees}
          icon={<Users />}
        />
        <CountCard
          label="Total Present"
          value={COUNTS.total.total_present_employees}
          icon={<UserCheck />}
        />
        <CountCard
          label="Total Absent"
          value={COUNTS.total.total_absent_employees}
          icon={<UserX />}
        />
      </div>

      {/* Filter trigger + applied chips */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-xl font-bold">Employees</h2>
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
          {appliedDesignationLabel && (
            <FilterChip label="Role" value={appliedDesignationLabel} />
          )}
          {appliedShiftLabel && (
            <FilterChip label="Shift" value={appliedShiftLabel} />
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
          Male
        </button>
        <button
          type="button"
          onClick={() => setGender("Female")}
          className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
            gender === "Female" ? "bg-blue-700 text-white" : "text-gray-600"
          }`}
        >
          Female
        </button>
      </div>

      {/* Gender-specific counts */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <CountCard
          label={gender === "Male" ? "Total Male" : "Total Female"}
          value={activeCount.gender_employees}
          icon={<Users />}
        />
        <CountCard
          label="Present"
          value={activeCount.present_employees}
          icon={<UserCheck />}
        />
        <CountCard
          label="Absent"
          value={activeCount.absent_employees}
          icon={<UserX />}
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name, emp ID, dept..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Employee list */}
      <div className="space-y-3">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
          >
            <div
              className={`w-14 h-14 rounded-xl ${avatarColor(emp.name)} text-white flex items-center justify-center font-bold shrink-0`}
            >
              {initials(emp.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{emp.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {emp.employee_id}
              </p>
              <p className="text-xs text-blue-600 truncate">
                {/* {[emp.department_name, emp.designation_name, emp.shift_name]
                  .filter(Boolean)
                  .join(" - ")} */}
                  {[emp.department_name]
                  .filter(Boolean)
                  .join(" - ")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/person/${emp.id}`)}
              aria-label={`View ${emp.name}`}
              className="inline-flex items-center justify-center !p-0 w-10 h-10 rounded-full bg-blue-50 text-blue-600 shrink-0"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <p className="text-gray-500 text-center py-8">No employees found.</p>
        )}
      </div>

      {/* ── Filter popup modal ── */}

      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Filter Employees</h3>
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
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <select
                  className={selectCls}
                  value={pendingFilters.designation_id}
                  onChange={(e) =>
                    setPendingFilters((p) => ({
                      ...p,
                      designation_id: e.target.value,
                    }))
                  }
                >
                  <option value="">All Designations</option>
                  {DESIGNATIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift
                </label>
                <select
                  className={selectCls}
                  value={pendingFilters.shift_id}
                  onChange={(e) =>
                    setPendingFilters((p) => ({
                      ...p,
                      shift_id: e.target.value,
                    }))
                  }
                >
                  <option value="">All Shifts</option>
                  {SHIFTS.map((b) => (
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

      {/* ── Employee detail bottom sheet ── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-xl ${avatarColor(selectedEmployee?.name ?? "E")} text-white flex items-center justify-center font-bold shrink-0`}
                >
                  {initials(selectedEmployee?.name ?? "E")}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {selectedEmployee?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {[
                      selectedEmployee?.employee_id,
                      selectedEmployee?.department_name,
                      selectedEmployee?.shift_name,
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
                        {d.device}
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
