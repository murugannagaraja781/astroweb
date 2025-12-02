import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors and retry
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Don't retry if already retried max times
        if (!originalRequest._retry) {
            originalRequest._retry = 0;
        }

        const maxRetries = 3;
        const retryDelay = 1000 * Math.pow(2, originalRequest._retry); // Exponential backoff

        // Retry on network errors or 5xx errors
        const shouldRetry =
            (!error.response || error.response.status >= 500) &&
            originalRequest._retry < maxRetries;

        if (shouldRetry) {
            originalRequest._retry += 1;
            console.log(
                `[API] Retrying request (${originalRequest._retry}/${maxRetries}):`,
                originalRequest.url
            );

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, retryDelay));

            return apiClient(originalRequest);
        }

        // Handle specific error codes
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Unauthorized - clear token and redirect to login
                    console.error('[API] Unauthorized - clearing token');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    break;
                case 403:
                    console.error('[API] Forbidden:', error.response.data);
                    break;
                case 404:
                    console.error('[API] Not found:', originalRequest.url);
                    break;
                default:
                    console.error('[API] Error:', error.response.status, error.response.data);
            }
        } else if (error.request) {
            // Network error
            console.error('[API] Network error - no response received');
        } else {
            console.error('[API] Request setup error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
