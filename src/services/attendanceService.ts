// src/services/attendanceService.ts
//
// Data source for the attendance report: fetches time-in/time-out records
// for a given date range.

import { getToken } from "./authService";

export interface AttendanceRecord {
  person_id: string;
  student_name: string;
  person_no: string;
  register_number: string;
  image: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  time_in_image: string | null;
  time_out_image: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch attendance records for a date range.
 * GET /AttendanceList/{start_date}/{end_date}/{department_id|null}
 * Dates expected in "YYYY-MM-DD" format. Pass departmentId as null/omit for
 * no department filter (sent as the literal string "null" in the URL).
 */
export async function fetchAttendanceList(
  startDate: string,
  endDate: string,
  departmentId: string | null = null,
): Promise<AttendanceRecord[]> {
  const deptSegment =
    departmentId && departmentId.trim() ? departmentId : "null";

  const response = await fetch(
    `${API_BASE_URL}/AttendanceList/${startDate}/${endDate}/${deptSegment}`,
    {
      method: "GET",
      // headers: authHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch attendance report (status ${response.status})`,
    );
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
