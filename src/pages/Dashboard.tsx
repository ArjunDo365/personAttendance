import { useCallback, useEffect, useState } from "react";
import { Users, UserCheck, UserX, Eye, Filter, X, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchDashboardNotificationList } from "../services/dashboardService";
import type {
  StaffMember,
  GenderCount,
  TotalCount,
} from "../services/dashboardService";
import { getCurrentUser } from "../services/authService";
import type { NotificationCategory } from "../services/authService";

const BRAND_COLOR = "#060C37";

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

type CountCardVariant = "brand" | "present" | "absent";

const COUNT_CARD_BG: Record<CountCardVariant, string> = {
  brand: "",
  present: "bg-green-600",
  absent: "bg-red-600",
};

function CountCard({
  label,
  value,
  icon,
  variant = "brand",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: CountCardVariant;
}) {
  const bgClass = variant === "brand" ? "" : COUNT_CARD_BG[variant];
  const style =
    variant === "brand" ? { backgroundColor: BRAND_COLOR } : undefined;

  return (
    <div
      className={`${bgClass} rounded-2xl p-2.5 sm:p-4 text-white flex flex-col gap-2 min-w-0 overflow-hidden`}
      style={style}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">
          {icon}
        </span>
        <p className="font-bold uppercase text-[9px] sm:text-[11px] leading-tight break-words min-w-0">
          {label}
        </p>
      </div>
      <div className="bg-white rounded-xl px-2.5 py-1 text-center self-start max-w-full">
        <p
          className="font-bold text-sm sm:text-lg leading-none truncate"
          style={{ color: BRAND_COLOR }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border max-w-full"
      style={{
        backgroundColor: `${BRAND_COLOR}1A`,
        color: BRAND_COLOR,
        borderColor: `${BRAND_COLOR}4D`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: BRAND_COLOR }}
      />
      <span className="truncate">
        {label}: {value}
      </span>
    </span>
  );
}

function StaffAvatar({ name, image }: { name: string; image: string | null }) {
  const [imgError, setImgError] = useState(false);

  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setImgError(true)}
        className="w-14 h-14 rounded-xl object-cover shrink-0"
      />
    );
  }

  return (
    <div
      className={`w-14 h-14 rounded-xl ${avatarColor(name)} text-white flex items-center justify-center font-bold shrink-0`}
    >
      {initials(name)}
    </div>
  );
}

function StatusBadge({ present }: { present: number }) {
  return present === 1 ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-green-100 text-green-700">
      Present
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-red-100 text-red-700">
      Absent
    </span>
  );
}

export default function Dashboard() {
  const REFRESH_TIME = 3 * 60;
  const navigate = useNavigate();

  const [gender, setGender] = useState("Male");
  const [search, setSearch] = useState("");
  const [countdown, setCountdown] = useState(REFRESH_TIME);

  const [appliedDepartmentId, setAppliedDepartmentId] = useState("");
  const [pendingDepartmentId, setPendingDepartmentId] = useState("");
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Departments available to this user come from their own notification
  // categories (stored in localStorage at login), not a separate API call.
  const [userDepartments, setUserDepartments] = useState<
    NotificationCategory[]
  >([]);
  const [currUser, setCurrUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [genderCount, setGenderCount] = useState<GenderCount | null>(null);
  const [totalCount, setTotalCount] = useState<TotalCount | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the current user's id + department (notification category) list once.
  useEffect(() => {
    const user = getCurrentUser();
    setCurrUser(user);
    setUserId(user?.id ?? null);
    setUserDepartments((user?.notifications ?? []).filter((n) => n.is_active));
  }, []);

  const loadStaffList = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardNotificationList(
        userId,
        gender,
        appliedDepartmentId,
      );
      setStaffList(result.data ?? []);
      setGenderCount(result.count?.[0] ?? null);
      setTotalCount(result.Totalcount?.[0] ?? null);
    } catch (err) {
      setError("Failed to load staff list.");
    } finally {
      setLoading(false);
    }
  }, [userId, gender, appliedDepartmentId]);

  // Reload whenever the user id is known, gender toggles, or department changes.
  useEffect(() => {
    loadStaffList();
  }, [loadStaffList]);

  // Countdown timer; refetches the list on each cycle.
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadStaffList();
          return REFRESH_TIME;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loadStaffList]);

  const applyFilter = () => {
    setAppliedDepartmentId(pendingDepartmentId);
    setShowFilterSheet(false);
  };

  const clearFilter = () => {
    setPendingDepartmentId("");
    setAppliedDepartmentId("");
    setShowFilterSheet(false);
  };

  const filteredStaff = staffList.filter((s) => {
    const t = search.trim().toLowerCase();
    if (!t) return true;

    // Special-case searching by attendance status.
    if ("present".startsWith(t) && t.length >= 3) return s.present === 1;
    if ("absent".startsWith(t) && t.length >= 3) return s.present === 0;

    return (
      s.name.toLowerCase().includes(t) ||
      s.register_number.toLowerCase().includes(t) ||
      s.department_name.toLowerCase().includes(t) ||
      s.designation_name.toLowerCase().includes(t)
    );
  });

  const appliedDeptLabel = appliedDepartmentId
    ? (userDepartments.find((d) => d.id === appliedDepartmentId)?.name ?? "")
    : "";

  const selectCls =
    "w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none " +
    "focus:ring-2 text-gray-700 bg-white text-sm";

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen px-4 pt-6 pb-10 overflow-x-hidden">
      {/* Header */}
      <div
        className="rounded-2xl p-5 text-white flex items-start justify-between mb-5 gap-3"
        style={{ backgroundColor: BRAND_COLOR }}
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">Welcome back</h1>
          <p className="text-blue-300 mt-1">{`${currUser?.firstName} ${currUser?.lastName}`}</p>
        </div>
        <div className="bg-white/10 rounded-xl px-3 py-2 text-center shrink-0">
          <p className="text-xs text-blue-200">Refresh in</p>
          <p className="font-bold text-sm">{countdown}s</p>
        </div>
      </div>

      {/* Total count cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <CountCard
          label="Total Staff"
          value={totalCount?.total_staff ?? "-"}
          icon={<Users />}
          variant="brand"
        />
        <CountCard
          label="Present"
          value={totalCount?.total_present_staff ?? "-"}
          icon={<UserCheck />}
          variant="present"
        />
        <CountCard
          label="Absent"
          value={totalCount?.total_absent_staff ?? "-"}
          icon={<UserX />}
          variant="absent"
        />
      </div>

      {/* Filter trigger + applied chip */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-xl font-bold">Staff</h2>
        <button
          type="button"
          onClick={() => {
            setPendingDepartmentId(appliedDepartmentId);
            setShowFilterSheet(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium shrink-0"
          style={{ backgroundColor: `${BRAND_COLOR}1A`, color: BRAND_COLOR }}
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {appliedDeptLabel && (
        <div className="flex flex-wrap gap-2 mb-4">
          <FilterChip label="Dept" value={appliedDeptLabel} />
        </div>
      )}

      {/* Gender segmented control */}
      <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-xl p-1 mb-4">
        <button
          type="button"
          onClick={() => setGender("Male")}
          className="py-2 rounded-lg text-sm font-semibold transition-colors"
          style={
            gender === "Male"
              ? { backgroundColor: BRAND_COLOR, color: "#fff" }
              : { color: "#4b5563" }
          }
        >
          Male
        </button>
        <button
          type="button"
          onClick={() => setGender("Female")}
          className="py-2 rounded-lg text-sm font-semibold transition-colors"
          style={
            gender === "Female"
              ? { backgroundColor: BRAND_COLOR, color: "#fff" }
              : { color: "#4b5563" }
          }
        >
          Female
        </button>
      </div>

      {/* Gender-specific counts */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <CountCard
          label={gender === "Male" ? "Total Male" : "Total Female"}
          value={genderCount?.gender_staff ?? "-"}
          icon={<Users />}
          variant="brand"
        />
        <CountCard
          label="Present"
          value={genderCount?.present_staff ?? "-"}
          icon={<UserCheck />}
          variant="present"
        />
        <CountCard
          label="Absent"
          value={genderCount?.absent_staff ?? "-"}
          icon={<UserX />}
          variant="absent"
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name, reg no, dept, present/absent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2"
          style={{ ["--tw-ring-color" as any]: BRAND_COLOR }}
        />
      </div>

      {/* Staff list */}
      {loading && <p className="text-gray-500 text-center py-8">Loading…</p>}
      {error && <p className="text-red-600 text-center py-8">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
            >
              <StaffAvatar name={staff.name} image={staff.image} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {staff.name}
                  </p>
                  <StatusBadge present={staff.present} />
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {staff.register_number}
                </p>
                <p className="text-xs truncate" style={{ color: BRAND_COLOR }}>
                  {[staff.department_name, staff.designation_name]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/person/${staff.id}`)}
                aria-label={`View ${staff.name}`}
                className="inline-flex items-center justify-center !p-0 w-10 h-10 rounded-full shrink-0"
                style={{
                  backgroundColor: `${BRAND_COLOR}1A`,
                  color: BRAND_COLOR,
                }}
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          ))}

          {filteredStaff.length === 0 && (
            <p className="text-gray-500 text-center py-8">No staff found.</p>
          )}
        </div>
      )}

      {/* Filter popup modal */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Filter Staff</h3>
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
                  style={{ ["--tw-ring-color" as any]: BRAND_COLOR }}
                  value={pendingDepartmentId}
                  onChange={(e) => setPendingDepartmentId(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {userDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={applyFilter}
                className="flex-1 py-3 text-white rounded-xl font-semibold text-sm"
                style={{ backgroundColor: BRAND_COLOR }}
              >
                Apply Filter
              </button>
              <button
                onClick={clearFilter}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
