# Unit Testing Guide - AstroWeb

## Overview
This project includes comprehensive unit tests for both client and server code using Jest and React Testing Library.

## Client-Side Testing

### Running Tests
```bash
cd /Users/wohozo/astroweb/client

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Files Created
1. **`MobileHome.test.jsx`** - Tests for mobile home page
   - Component rendering
   - Online astrologers display
   - Navigation functionality
   - Loading states
   - Skeleton loaders

2. **`MobileNav.test.jsx`** - Tests for mobile navigation
   - Navigation items display
   - Login/Logout button states
   - Role-based dashboard links
   - Click handlers

3. **`LazyImage.test.jsx`** - Tests for lazy loading images
   - IntersectionObserver integration
   - Loading states
   - onLoad callbacks

### Test Structure
```javascript
describe('Component Name', () => {
  test('should do something', () => {
    // Arrange
    render(<Component />);

    // Act
    fireEvent.click(element);

    // Assert
    expect(element).toBeInTheDocument();
  });
});
```

### Coverage Thresholds
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Server-Side Testing

### Running Tests
```bash
cd /Users/wohozo/astroweb/server

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Files Created
1. **`otpRoutes.test.js`** - Tests for OTP routes
   - POST /api/otp/send endpoint
   - POST /api/otp/verify endpoint
   - Error handling
   - Status codes

2. **`otpController.test.js`** - Tests for OTP controller
   - sendOtp function
   - verifyOtp function
   - MSG91 API integration
   - Error scenarios

### Mocking Strategy
```javascript
// Mock external dependencies
jest.mock('axios');
jest.mock('../models/User');

// Mock implementation
axios.post.mockResolvedValue({ data: { type: 'success' } });
```

## Test Configuration

### Client Jest Config (`client/jest.config.js`)
- **Environment**: jsdom (browser simulation)
- **Setup**: setupTests.js for global mocks
- **Transform**: babel-jest for ES6/JSX
- **Coverage**: Excludes main.jsx, test files

### Server Jest Config (`server/jest.config.js`)
- **Environment**: node
- **Test Match**: `**/__tests__/**/*.test.js`
- **Coverage**: controllers, routes, middleware

## Writing New Tests

### Client Component Test Template
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(
      <BrowserRouter>
        <MyComponent />
      </BrowserRouter>
    );

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Server Route Test Template
```javascript
const request = require('supertest');
const express = require('express');
const myRoutes = require('../routes/myRoutes');

describe('My Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/my', myRoutes);
  });

  test('GET /api/my/endpoint', async () => {
    const response = await request(app).get('/api/my/endpoint');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

## Best Practices

### 1. Test Naming
- Use descriptive test names
- Follow pattern: "should [expected behavior] when [condition]"
- Example: "should display loading spinner when data is fetching"

### 2. Arrange-Act-Assert Pattern
```javascript
test('example test', () => {
  // Arrange - setup test data
  const mockData = { name: 'Test' };

  // Act - perform action
  const result = myFunction(mockData);

  // Assert - verify result
  expect(result).toBe(expectedValue);
});
```

### 3. Mock External Dependencies
- Mock API calls with axios
- Mock database with mongoose models
- Mock authentication context
- Mock framer-motion animations

### 4. Test Coverage Goals
- Aim for 70%+ coverage
- Focus on critical paths
- Test edge cases and error scenarios
- Don't test implementation details

### 5. Avoid Common Pitfalls
- Don't test third-party libraries
- Don't test implementation (test behavior)
- Avoid snapshot testing for dynamic content
- Keep tests isolated and independent

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

### Pre-commit Hook (Husky)
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test"
```

## Debugging Tests

### Run Specific Test
```bash
# Run single test file
npm test -- MobileHome.test.jsx

# Run tests matching pattern
npm test -- --testNamePattern="renders"
```

### Enable Verbose Output
```bash
npm test -- --verbose
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## Next Steps

1. **Add More Tests**:
   - AuthContext tests
   - BottomSheet tests
   - VirtualList tests
   - Admin dashboard tests

2. **Integration Tests**:
   - Full user flows
   - API integration tests
   - Socket.IO event tests

3. **E2E Tests** (Future):
   - Use Playwright or Cypress
   - Test complete user journeys
   - Visual regression testing

## Resources
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest](https://github.com/visionmedia/supertest)
