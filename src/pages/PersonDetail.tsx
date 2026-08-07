import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Hash,
  Calendar,
  MapPin,
  Phone,
  Briefcase,
} from "lucide-react";
import { fetchPersonById } from "../services/personService";
import type { PersonActivityRecord } from "../services/personService";

const BRAND_COLOR = "#060C37";

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

function PersonAvatar({ name, image }: { name: string; image: string }) {
  const [imgError, setImgError] = useState(false);

  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setImgError(true)}
        className="w-16 h-16 rounded-xl object-cover shrink-0"
      />
    );
  }

  return (
    <div
      className={`w-16 h-16 rounded-xl ${avatarColor(name)} text-white flex items-center justify-center font-bold text-lg shrink-0`}
    >
      {initials(name)}
    </div>
  );
}

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [records, setRecords] = useState<PersonActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      if (!id) {
        setError("No person id provided.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        const data = await fetchPersonById(id);
        if (active) {
          const sorted = [...data].sort((a, b) =>
            a.datatime < b.datatime ? 1 : -1,
          );
          setRecords(sorted);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load person details.",
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

  // Profile fields are repeated on every record — use the first one.
  const profile = records[0] ?? null;

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 text-gray-600"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Employee Details</h1>
      </div>

      {isLoading && (
        <p className="text-gray-500 text-center py-8">Loading details...</p>
      )}
      {error && !isLoading && (
        <p className="text-red-500 text-center py-8">{error}</p>
      )}
      {!isLoading && !error && !profile && (
        <p className="text-gray-500 text-center py-8">Person not found.</p>
      )}

      {!isLoading && !error && profile && (
        <div className="space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              <PersonAvatar name={profile.name} image={profile.image} />
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
                <Briefcase
                  className="w-5 h-5 shrink-0"
                  style={{ color: BRAND_COLOR }}
                />
                <div>
                  <p className="text-xs text-gray-500">
                    Department / Designation
                  </p>
                  <p className="font-medium text-gray-900">
                    {[profile.department_name, profile.designation_name]
                      .filter(Boolean)
                      .join(" - ")}
                  </p>
                </div>
              </div>

              {(profile.contact_person_name ||
                profile.contact_person_number) && (
                <div className="flex items-center gap-3">
                  <Phone
                    className="w-5 h-5 shrink-0"
                    style={{ color: BRAND_COLOR }}
                  />
                  <div>
                    <p className="text-xs text-gray-500">Emergency Contact</p>
                    <p className="font-medium text-gray-900">
                      {[
                        profile.contact_person_name,
                        profile.contact_person_number,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3">Attendance History</h3>

            {records.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No activity records found.
              </p>
            ) : (
              <div className="space-y-3">
                {records.map((record, idx) => (
                  <div
                    key={`${record.asset_no}-${record.datatime}-${idx}`}
                    className="bg-white rounded-2xl shadow-sm p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900">
                        {record.model_name}
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
                        <MapPin
                          className="w-5 h-5 shrink-0"
                          style={{ color: BRAND_COLOR }}
                        />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="font-medium text-gray-900">
                            {record.model_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar
                          className="w-5 h-5 shrink-0"
                          style={{ color: BRAND_COLOR }}
                        />
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="font-medium text-gray-900">
                            {formatCreatedOn(record.datatime)}
                          </p>
                        </div>
                      </div>

                      {/* <div className="flex items-center gap-3">
                        <Hash
                          className="w-5 h-5 shrink-0"
                          style={{ color: BRAND_COLOR }}
                        />
                        <div>
                          <p className="text-xs text-gray-500">Asset No.</p>
                          <p className="font-medium text-gray-900">
                            {record.asset_no}
                          </p>
                        </div>
                      </div> */}
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
