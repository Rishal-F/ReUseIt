/**
 * API utility module.
 * Creates a reusable Axios instance for backend requests and tracks user interactions.
 */
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

export function trackVisit(serviceName) {
  console.log("User visited:", serviceName);
}

export default API;