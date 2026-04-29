/**
 * API utility module.
 * Creates a reusable Axios instance for backend requests and tracks user interactions.
 */
import axios from "axios";

// Export a single API base value (env or fallback)
export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

if (!process.env.REACT_APP_API_URL) {
  // warn once when running without a configured API host
  // developer can still rely on the fallback during local testing
  // eslint-disable-next-line no-console
  console.warn("REACT_APP_API_URL is not set — falling back to http://localhost:5000");
}

export function getApiBaseUrl() {
  return String(API_BASE).replace(/\/+$/, "");
}

// Build a full URL to the backend API. Accepts paths like '/api/xxx' or 'xxx'
export function buildApiUrl(path) {
  const base = getApiBaseUrl();
  let normalizedPath = path;
  if (!path.startsWith("/api")) {
    normalizedPath = path.startsWith("/") ? `/api${path}` : `/api/${path}`;
  }
  return `${base}${normalizedPath}`;
}

// Axios instance points to the API base + '/api' so axios calls can continue
// to use relative paths like '/stats' and resolve to '<API_BASE>/api/stats'.
const API = axios.create({
  baseURL: `${getApiBaseUrl()}/api`.replace(/\/+$/, ""),
  timeout: 10000,
});

export function trackVisit(serviceName) {
  console.log("User visited:", serviceName);
}

export default API;