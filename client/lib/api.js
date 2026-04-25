const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Authenticated API fetch wrapper.
 * Reads accessToken from localStorage and attaches Authorization header.
 *
 * @param {string} path - API path (e.g. "/api/employees")
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiFetch(path, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // Attempt token refresh
    const refreshed = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      const data = await refreshed.json();
      localStorage.setItem("accessToken", data.accessToken);
      // Retry original request
      return apiFetch(path, options);
    }
    // Refresh failed — redirect to login
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

// ─── Convenience methods ──────────────────────────────────────────────────────

/** @param {string} path @param {any} body */
export const post = (path, body) =>
  apiFetch(path, { method: "POST", body: JSON.stringify(body) });

/** @param {string} path @param {any} body */
export const put = (path, body) =>
  apiFetch(path, { method: "PUT", body: JSON.stringify(body) });

/** @param {string} path */
export const del = (path) => apiFetch(path, { method: "DELETE" });

/** @param {string} path */
export const get = (path) => apiFetch(path);
