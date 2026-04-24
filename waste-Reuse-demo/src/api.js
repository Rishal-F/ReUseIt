/**
 * API utility module.
 * Creates a reusable Axios instance for backend requests and tracks user interactions.
 */
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 10000
});

export function trackVisit(serviceName) {
  console.log("User visited:", serviceName);
}

export default API;