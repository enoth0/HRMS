import { post } from "./api.js";

/**
 * Log in a user and store tokens/user data.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, accessToken: string }>}
 */
export async function login(email, password) {
  const data = await post("/api/auth/login", { email, password });
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

/**
 * Log out — clears local storage and calls backend.
 */
export async function logout() {
  try {
    await post("/api/auth/logout", {});
  } catch (_) {}
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

/**
 * Get the currently logged-in user from localStorage.
 * @returns {{ id: string, name: string, email: string, role: string } | null}
 */
export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!localStorage.getItem("accessToken");
}

/**
 * Get the role-specific dashboard path.
 * @param {string} role
 * @returns {string}
 */
export function getDashboardPath(role) {
  const map = {
    admin: "/dashboard/admin",
    hr_recruiter: "/dashboard/hr",
    senior_manager: "/dashboard/senior-manager",
    employee: "/dashboard/employee",
  };
  return map[role] || "/dashboard/employee";
}
