// src/services/userService.ts
//
// User profile update calls — currently just re-associating a device's
// OneSignal subscription id with the logged-in user.

import { getToken } from "./authService";
import { API_URL } from "./authService";

const UPDATE_USER_API_URL = `${API_URL}/UpdateUser`;

export interface UpdateUserResult {
  Type: string; // "S" = success
  Message: string;
}

/**
 * Associate (or re-associate) a OneSignal subscription id with a user.
 * POST /UpdateUser  { user_id, onesignal_subscription_id }
 */
export async function updateUserOneSignalId(
  userId: string | number,
  onesignalSubscriptionId: string,
): Promise<UpdateUserResult> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(UPDATE_USER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        user_id: userId,
        onesignal_subscription_id: onesignalSubscriptionId,
      }),
    });
  } catch (err) {
    throw new Error("Unable to reach the server. Please try again.");
  }

  let data: UpdateUserResult;
  try {
    data = await response.json();
  } catch {
    throw new Error("Unexpected response from the server.");
  }

  if (!response.ok || data?.Type !== "S") {
    throw new Error(data?.Message || "Failed to update notification settings.");
  }

  return data;
}
