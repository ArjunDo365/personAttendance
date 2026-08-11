import { getToken } from "./authService";

export interface ChangePasswordPayload {
  id: string | number;
  old_password: string;
  password: string;
}

export interface ChangePasswordResponse {
  Type: "S" | "E";
  Message: string;
}

// const API_BASE_URL = "https://animal.do365tech.com/admin/api";
// const API_BASE_URL = "/admin/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const API_BASE_URL = "http://192.168.29.62:8000/api";
const CHANGE_PASSWORD_API_URL = `${API_BASE_URL}/ChangePassword`;

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResponse> {
  const response = await fetch(CHANGE_PASSWORD_API_URL, {
    method: "POST",
    // headers: authHeaders(),
    body: JSON.stringify({
      user_id: payload.id,
      old_password: payload.old_password,
      password: payload.password,
    }),
  });

  let data: ChangePasswordResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error("Unexpected response from the server.");
  }

  if (!response.ok || data?.Type !== "S") {
    throw new Error(
      data?.Message || `Failed to change password (status ${response.status})`,
    );
  }

  return data;
}
