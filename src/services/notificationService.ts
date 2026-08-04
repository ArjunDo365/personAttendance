import OneSignal from "react-onesignal";
import type { NotificationClickEvent } from "react-onesignal";
// import { API_URL } from "./authService";

// Replace with your real OneSignal app id from the OneSignal dashboard.
// const ONESIGNAL_APP_ID = "b5ab97ed-319b-4fd6-a750-adbe2d9fa3a2";
const ONESIGNAL_APP_ID = "e1d16f8f-09f2-497c-903b-6dcf36ddd323";
// The OneSignal worker lives under /push/onesignal/ so it doesn't clash with
// the PWA's root-scope service worker (vite-plugin-pwa).
const ONESIGNAL_SW_SCOPE = "/push/onesignal/";
const ONESIGNAL_SW_PATH = "push/onesignal/OneSignalSDKWorker.js";

let initialized = false;
let cachedSubscriptionId: string | null = null;

let deepLinkNavigator: ((path: string) => void) | null = null;

export function setDeepLinkNavigator(fn: (path: string) => void): void {
  deepLinkNavigator = fn;
}

export async function initOneSignal(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      safari_web_id: "web.onesignal.auto.5462a642-4744-4944-be08-d03aa1430cc8",
      serviceWorkerParam: { scope: ONESIGNAL_SW_SCOPE },
      serviceWorkerPath: ONESIGNAL_SW_PATH,
      autoPrompt: false,
      autoRegister: false,
      notifyUrl: "https://onesignal.com/api/v1/notification",
      allowLocalhostAsSecureOrigin: true,
    });

    OneSignal.Notifications.addEventListener(
      "click",
      (event: NotificationClickEvent) => {
        const path = extractDeepLinkPath(event);
        if (!path) return;
        if (deepLinkNavigator) {
          deepLinkNavigator(path);
        } else if (typeof window !== "undefined") {
          window.location.href = path;
        }
      },
    );

    await OneSignal.Notifications.requestPermission();

    cachedSubscriptionId = OneSignal.User?.PushSubscription?.id ?? null;

    OneSignal.User.PushSubscription.addEventListener("change", (event) => {
      cachedSubscriptionId = event?.current?.id ?? null;
    });
  } catch (err) {
    console.warn("[OneSignal] initialization failed:", err);
  }
}

export async function promptForNotifications(userId: string): Promise<void> {
  if (!initialized) return;

  try {
    const granted = await OneSignal.Notifications.requestPermission();
    if (!granted) return;

    await OneSignal.login(userId);
  } catch (err) {
    console.warn("[OneSignal] prompt/login failed:", err);
  }
}

export function getOneSignalSubscriptionId(): string | null {
  if (!initialized) return null;
  try {
    return cachedSubscriptionId ?? OneSignal.User?.PushSubscription?.id ?? null;
  } catch (err) {
    console.warn("[OneSignal] could not read subscription id:", err);
    return null;
  }
}

export async function waitForOneSignalSubscriptionId(
  timeoutMs = 5000,
): Promise<string | null> {
  const existing = getOneSignalSubscriptionId();
  if (existing) return existing;

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const id = getOneSignalSubscriptionId();
    if (id) return id;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return null;
}

function extractDeepLinkPath(event: NotificationClickEvent): string | null {
  const candidates: unknown[] = [
    (event as any)?.result?.url,
    (event as any)?.notification?.launchURL,
    (event as any)?.notification?.additionalData?.url,
    (event as any)?.notification?.additionalData?.path,
    (event as any)?.notification?.additionalData?.deeplink,
  ];

  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    const path = raw.startsWith("http") ? new URL(raw).pathname : raw;
    if (path.startsWith("/employees")) return path;
  }
  return null;
}

const UPDATE_SUBSCRIPTION_API_URL =
  "https://animal.do365tech.com/admin/api/UpdateSubscription";
// const UPDATE_SUBSCRIPTION_API_URL =  `http://192.168.29.62:8000/api/UpdateSubscription`;
// "http://localhost:8000/api";

export async function syncOneSignalSubscription(
  apiToken: string,
  deviceId: string,
): Promise<void> {
  const subscriptionId = await waitForOneSignalSubscriptionId(10000);

  if (!subscriptionId) {
    console.warn(
      "[OneSignal] subscription id never became available; skipping UpdateSubscription call.",
    );
    return;
  }

  try {
    const response = await fetch(UPDATE_SUBSCRIPTION_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        device_id: deviceId,
        onesignal_subscription_id: subscriptionId,
      }),
    });

    if (!response.ok) {
      console.warn(
        "[OneSignal] UpdateSubscription call failed:",
        response.status,
      );
    }
  } catch (err) {
    console.warn("[OneSignal] UpdateSubscription request error:", err);
  }
}
