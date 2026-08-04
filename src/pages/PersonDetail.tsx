import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Hash,
  Calendar,
  MapPin,
  Phone,
  GraduationCap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

interface StudentProfile {
  id: string;
  name: string;
  register_number: string;
  department_name: string;
  course_name: string;
  batch_name: string;
  contact_person_name: string;
  contact_person_number: string;
}

interface AttendanceRecord {
  unique_id: string;
  asset_no: string;
  type: "in" | "out";
  created_on: string; // "YYYY-MM-DD HH:mm:ss"
}

// ─── Hardcoded demo data (swap for a real API call later) ─────────────────
// TODO: replace with fetchStudentById(id) once the backend endpoint is
// ready — same shape as fetchAnimalById.

const MOCK_PROFILES: Record<string, StudentProfile> = {
  "1": {
    id: "1",
    name: "Arjun",
    register_number: "21CS045",
    department_name: "Computer Science",
    course_name: "B.E.",
    batch_name: "2023-2027",
    contact_person_name: "Suresh Kumar",
    contact_person_number: "+91 98765 43210",
  },
};

const MOCK_RECORDS: AttendanceRecord[] = [
  {
    unique_id: "r1",
    asset_no: "Main Gate",
    type: "in",
    created_on: "2026-08-04 08:15:00",
  },
  {
    unique_id: "r2",
    asset_no: "Library",
    type: "in",
    created_on: "2026-08-04 10:05:00",
  },
  {
    unique_id: "r3",
    asset_no: "Library",
    type: "out",
    created_on: "2026-08-04 11:40:00",
  },
  {
    unique_id: "r4",
    asset_no: "Main Gate",
    type: "out",
    created_on: "2026-08-04 17:20:00",
  },
];

function avatarColor(name: string) {
  const colors = [
    "bg-blue-600",
    "bg-violet-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatCreatedOn(createdOn: string | undefined | null): string {
  // Backend sends "YYYY-MM-DD HH:mm:ss" — parse manually since browsers
  // (Safari in particular) don't reliably parse space-separated datetimes.
  if (!createdOn) return "—";

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

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      if (!id) {
        setError("No student id provided.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        // TODO: swap for a real API call, e.g.
        // const data = await fetchStudentById(id);
        // setProfile(data.profile);
        // setRecords(data.records);
        await new Promise((resolve) => setTimeout(resolve, 300)); // simulate network
        if (active) {
          const foundProfile = MOCK_PROFILES[id] ?? MOCK_PROFILES["1"];
          const sorted = [...MOCK_RECORDS].sort((a, b) =>
            a.created_on < b.created_on ? 1 : -1,
          );
          setProfile(foundProfile);
          setRecords(sorted);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load student details.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 text-gray-600"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Student Details</h1>
      </div>

      {isLoading && (
        <p className="text-gray-500 text-center py-8">Loading details...</p>
      )}
      {error && !isLoading && (
        <p className="text-red-500 text-center py-8">{error}</p>
      )}
      {!isLoading && !error && !profile && (
        <p className="text-gray-500 text-center py-8">Student not found.</p>
      )}

      {!isLoading && !error && profile && (
        <div className="space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-16 h-16 rounded-xl ${avatarColor(profile.name)} text-white flex items-center justify-center font-bold text-lg shrink-0`}
              >
                {initials(profile.name)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {profile.register_number}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">
                    Department / Course / Batch
                  </p>
                  <p className="font-medium text-gray-900">
                    {[
                      profile.department_name,
                      profile.course_name,
                      profile.batch_name,
                    ]
                      .filter(Boolean)
                      .join(" - ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Contact Person</p>
                  <p className="font-medium text-gray-900">
                    {profile.contact_person_name} ·{" "}
                    {profile.contact_person_number}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance history */}
          <div>
            <h3 className="text-lg font-bold mb-3">Attendance History</h3>

            {records.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No activity records found.
              </p>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div
                    key={record.unique_id}
                    className="bg-white rounded-2xl shadow-sm p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900">
                        {record.asset_no}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full uppercase ${
                          record.type === "in"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {record.type}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="font-medium text-gray-900">
                            {record.asset_no}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="font-medium text-gray-900">
                            {formatCreatedOn(record.created_on)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Record ID</p>
                          <p className="font-medium text-gray-900">
                            {record.unique_id}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
