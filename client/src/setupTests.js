import '@testing-library/jest-dom';

// Mock import.meta for Vite environment variables
global.import = {
    meta: {
        env: {
            VITE_API_URL: 'http://localhost:9001',
            VITE_MSG91_AUTHKEY: 'test-key',
            VITE_MSG91_WIDGET_ID: 'test-widget-id',
        },
    },
};

// Also set process.env as fallback
process.env.VITE_API_URL = 'http://localhost:9001';
process.env.VITE_MSG91_AUTHKEY = 'test-key';
process.env.VITE_MSG91_WIDGET_ID = 'test-widget-id';
