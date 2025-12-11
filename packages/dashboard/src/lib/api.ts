import { safeStorageRemove } from "@/lib/browser";
import axios from "axios";

// SpendRule: Point to the correct worker API URL
// In production, use deployed worker; in development, use local or override with VITE_API_BASE_URL
const API_BASE =
	import.meta.env.VITE_API_BASE_URL ||
	(import.meta.env.DEV
		? "/api"
		: "https://spendrule-dev.oluwamakinwa.workers.dev/api");

export const api = axios.create({
	baseURL: API_BASE,
	// Give slower networks and downloads headroom; specific calls can override
	timeout: 120000,
	headers: {
		"Content-Type": "application/json",
	},
	// Note: Auth credentials are set dynamically via Authorization header in auth store
});

// Add request interceptor to ensure auth headers are always sent
api.interceptors.request.use((config) => {
	// Log requests in development
	if (import.meta.env.DEV) {
		console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
	}
	return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (import.meta.env.DEV) {
			console.error("API Error:", error.response?.data || error.message);
		}

		// Handle auth errors
		if (error.response?.status === 401) {
			// Clear stored tokens on auth error (safe for private browsing)
			safeStorageRemove("explorer_session_token");
		}

		return Promise.reject(error);
	},
);
