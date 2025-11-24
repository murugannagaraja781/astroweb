export default {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'routes/**/*.js',
        'middleware/**/*.js',
        '!**/node_modules/**',
    ],
    testMatch: ['**/__tests__/**/*.test.js'],
    verbose: true,
};
