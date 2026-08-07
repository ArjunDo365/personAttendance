// src/services/personService.ts
//
// Data source for a single person's profile + attendance history.

import { getToken } from "./authService";

export interface PersonActivityRecord {
  asset_no: string;
  model_name: string;
  type: string; // "in" | "out" (observed values)
  datatime: string; // "YYYY-MM-DD HH:mm:ss"
  name: string;
  contact_person_name: string;
  contact_person_number: string;
  gender: string;
  image: string;
  register_number: string;
  mobile_number: string;
  department_name: string;
  designation_name: string;
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
 * Fetch a person's profile + attendance activity by id.
 * GET /DashBoardStudentViewById/{id}
 * Returns an array where every item repeats the person's profile fields
 * alongside one activity record (asset_no, model_name, type, datatime).
 */
export async function fetchPersonById(
  id: string,
): Promise<PersonActivityRecord[]> {
  const response = await fetch(
    `${API_BASE_URL}/DashBoardStudentViewById/${id}`,
    {
      method: "GET",
    //   headers: authHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch person details (status ${response.status})`,
    );
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
