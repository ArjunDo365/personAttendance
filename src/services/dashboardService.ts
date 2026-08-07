// src/services/dashboardService.ts
//
// Data source for the staff dashboard: staff list + counts, scoped to a
// user, gender, and optionally a department (the user's own notification
// categories, sourced from authService.getCurrentUser()).

import { getToken } from "./authService";

export interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  mobile_number: string | null;
  address: string | null;
  register_number: string;
  gender: string;
  image: string | null;
  department_name: string;
  designation_name: string;
  present: number; // 1 = present, 0 = absent
}

export interface GenderCount {
  gender_staff: number;
  present_staff: number;
  absent_staff: number;
}

export interface TotalCount {
  total_staff: number;
  total_present_staff: number;
  total_absent_staff: number;
}

export interface DashboardStaffResponse {
  count: GenderCount[];
  Totalcount: TotalCount[];
  data: StaffMember[];
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
 * Fetch the staff list + counts for the dashboard notification view,
 * scoped to a user, gender, and optionally a department.
 * GET /DashBoardNotificationList/{user_id}/{gender}/{department_id}
 * Pass an empty string for departmentId to mean "all departments" — sent
 * as the literal path segment "all".
 */
export async function fetchDashboardNotificationList(
  userId: string,
  gender: string,
  departmentId: string,
): Promise<DashboardStaffResponse> {
  const deptSegment = departmentId ? departmentId : "all";

  const response = await fetch(
    `${API_BASE_URL}/DashBoardNotificationList/${userId}/${gender}/${deptSegment}`,
    {
      method: "GET",
      // headers: authHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch notification list (status ${response.status})`,
    );
  }

  const data = await response.json();
  return {
    count: Array.isArray(data?.count) ? data.count : [],
    Totalcount: Array.isArray(data?.Totalcount) ? data.Totalcount : [],
    data: Array.isArray(data?.data) ? data.data : [],
  };
}
