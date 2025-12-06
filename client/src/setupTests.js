import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() {
        return [];
    }
    unobserve() { }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        button: ({ children, ...props }) => <button {...props}>{children}</button>,
        nav: ({ children, ...props }) => <nav {...props}>{children}</nav>,
        img: ({ children, ...props }) => <img {...props}>{children}</img>,
        span: ({ children, ...props }) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }) => children,
    useMotionValue: () => 0,
    useTransform: () => 0,
}));
