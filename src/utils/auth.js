const AUTH_STORAGE_KEY = "realestateplatform-auth";
const CURRENT_USER_KEY = "realestateplatform-current-user";
const SESSION_STORAGE_KEY = "realestateplatform-session";

export function isAuthenticated() {
  return getCurrentUser() !== null;
}

export function getCurrentUser() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const sessionData = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const legacyData = window.localStorage.getItem(CURRENT_USER_KEY);
    const legacyAuthenticated = window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
    const userData = sessionData || (legacyAuthenticated ? legacyData : null);
    const user = userData ? JSON.parse(userData) : null;
    return user && typeof user === "object" && typeof user.username === "string" ? user : null;
  } catch {
    return null;
}
}

export function setAuthenticated(user) {
  if (typeof window === "undefined" || !user || typeof user.username !== "string") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new Event("authchange"));
}

export function clearAuthenticated() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event("authchange"));
}
