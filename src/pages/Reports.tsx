import { useMemo, useState } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { Users, UserCheck, UserX } from "lucide-react";
import {
  fetchAttendanceList,
  type AttendanceRecord,
} from "../services/attendanceService";

// ─── Helpers ────────────────────────────────────────────────────────────

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

function formatTime(time: string | null): string {
  if (!time) return "-";
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (isNaN(hour) || isNaN(minute)) return time;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Seconds-since-midnight for a "HH:mm:ss" (or "HH:mm") string.
function toSeconds(time: string): number {
  const [h, m, s] = time.split(":").map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

// Matches the desktop app's HH:mm formatting for accumulated minutes.
function formatMinutesToHHMM(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

interface WorkedSegment {
  in: string;
  out: string;
}

interface PersonAttendanceGroup {
  person_id: string;
  student_name: string;
  register_number: string;
  image: string | null;
  workedTimes: WorkedSegment[];
  totalMinutes: number;
}

// Groups raw records by person, summing every in/out pair's duration —
// same logic as the desktop AttendanceDetails page (grouped by
// person_id + date; since this view is single-date, grouping by person
// alone is equivalent).
function groupAttendance(records: AttendanceRecord[]): PersonAttendanceGroup[] {
  const grouped: Record<string, PersonAttendanceGroup> = {};

  for (const item of records) {
    const key = item.person_id;

    if (!grouped[key]) {
      grouped[key] = {
        person_id: item.person_id,
        student_name: item.student_name,
        register_number: item.register_number,
        image: item.image,
        workedTimes: [],
        totalMinutes: 0,
      };
    }

    if (item.time_in && item.time_out) {
      grouped[key].workedTimes.push({ in: item.time_in, out: item.time_out });

      const diffInSeconds = toSeconds(item.time_out) - toSeconds(item.time_in);
      grouped[key].totalMinutes += Math.round(diffInSeconds / 60);
    }
  }

  return Object.values(grouped);
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
  wide = false,
  variant = "brand",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  wide?: boolean;
  variant?: CountCardVariant;
}) {
  const bgClass = variant === "brand" ? "" : COUNT_CARD_BG[variant];
  const style =
    variant === "brand" ? { backgroundColor: BRAND_COLOR } : undefined;

  return (
    <div
      className={`${bgClass} rounded-2xl p-3 sm:p-4 text-white min-w-0 overflow-hidden ${
        wide ? "col-span-2" : ""
      }`}
      style={style}
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
        <p
          className="font-bold text-base sm:text-lg leading-none truncate"
          style={{ color: BRAND_COLOR }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function PersonAvatar({ name, image }: { name: string; image: string | null }) {
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

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const isoDate = selectedDate ? toISODate(selectedDate) : "";

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!isoDate) {
      setError("Please select a date.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      // Backend still expects a start and end date — send the same
      // selected date for both.
      const data = await fetchAttendanceList(isoDate, isoDate);
      setRecords(data);
      setHasSearched(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load report data.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const groupedAttendance = useMemo(() => groupAttendance(records), [records]);

  const totalRecords = records.length;
  const totalPresent = records.filter((r) => !!r.time_in).length;
  const totalAbsent = totalRecords - totalPresent;

  return (
    <div className="px-4 pt-6 overflow-x-hidden max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      {/* Date picker */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mt-2 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Date
          </label>
          <Flatpickr
            options={{
              mode: "single",
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "d M Y",
              disableMobile: true,
              altInputClass:
                "form-input w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm",
            }}
            value={selectedDate}
            className="form-input w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm"
            style={{ ["--tw-ring-color" as any]: BRAND_COLOR }}
            onChange={(selectedDates) => {
              if (selectedDates.length === 1) {
                setSelectedDate(selectedDates[0]);
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full mt-3 rounded-lg disabled:opacity-60 text-white font-semibold py-2.5 transition-colors"
          style={{ backgroundColor: BRAND_COLOR }}
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
          {/* Selected date indicator */}
          <p className="text-gray-500 text-sm mb-4 break-words">
            Showing results for{" "}
            <span className="font-semibold text-gray-700">
              {new Date(isoDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>

          {/* Count cards — same look as the dashboard */}
          {/* <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
            <CountCard
              label="Total Records"
              value={totalRecords}
              icon={<Users />}
              wide
              variant="brand"
            />
            <CountCard
              label="Time-In Recorded"
              value={totalPresent}
              icon={<UserCheck />}
              variant="present"
            />
            <CountCard
              label="No Time-In"
              value={totalAbsent}
              icon={<UserX />}
              variant="absent"
            />
          </div> */}

          {/* Attendance list */}
          <h2 className="text-2xl font-bold mt-6 mb-3">Attendance</h2>
          <div className="space-y-3">
            {groupedAttendance.map((person) => {
              const totalHours = formatMinutesToHHMM(person.totalMinutes);
              const otMinutes =
                person.totalMinutes > 480 ? person.totalMinutes - 480 : 0;
              const otHours = formatMinutesToHHMM(otMinutes);

              return (
                <div
                  key={person.person_id}
                  className="bg-white rounded-2xl shadow-sm p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <PersonAvatar
                      name={person.student_name}
                      image={person.image}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {person.student_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {person.register_number}
                      </p>
                    </div>
                  </div>

                  {/* Worked time segments */}
                  {person.workedTimes.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {person.workedTimes.map((seg, i) => (
                        <p key={i} className="text-xs text-gray-600">
                          <span className="font-medium text-green-600">
                            In:
                          </span>{" "}
                          {formatTime(seg.in)}{" "}
                          <span className="font-medium text-red-600 ml-2">
                            Out:
                          </span>{" "}
                          {formatTime(seg.out)}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Worked / OT / Total hours */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-gray-400 font-semibold">
                        Worked
                      </p>
                      <p
                        className="text-sm font-bold"
                        style={{ color: BRAND_COLOR }}
                      >
                        {totalHours}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-gray-400 font-semibold">
                        OT
                      </p>
                      <p
                        className="text-sm font-bold"
                        style={{ color: BRAND_COLOR }}
                      >
                        {otHours}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-gray-400 font-semibold">
                        Total
                      </p>
                      <p
                        className="text-sm font-bold"
                        style={{ color: BRAND_COLOR }}
                      >
                        {totalHours}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {groupedAttendance.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No attendance records for this date.
              </p>
            )}
          </div>
        </>
      )}

      {!hasSearched && !isLoading && !error && (
        <p className="text-gray-500 text-center py-8">
          Select a date and tap Search to view the report.
        </p>
      )}
    </div>
  );
}
