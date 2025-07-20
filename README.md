# 🧪 Week 6: Testing and Debugging Assignment

A comprehensive MERN stack application with full testing implementation including unit tests, integration tests, and end-to-end tests.

## 📋 Project Overview

This project demonstrates comprehensive testing strategies for a MERN stack application, including:

- **Unit Testing**: React components and server utilities
- **Integration Testing**: API endpoints and component interactions
- **End-to-End Testing**: Full user workflows with Cypress
- **Debugging Techniques**: Error boundaries, logging, and debugging tools

## 🏗️ Architecture

```
week-6-test-debug-assignment-Itchy-Fingers/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── tests/                  # Test files
│   │   │   ├── unit/              # Unit tests
│   │   │   ├── integration/       # Integration tests
│   │   │   └── setup.js           # Test setup
│   │   └── App.jsx                # Main app component
│   ├── cypress/                    # E2E testing
│   │   ├── e2e/                   # E2E test specs
│   │   └── support/               # Cypress support files
│   └── package.json               # Client dependencies
├── server/                         # Express backend
│   ├── src/
│   │   ├── models/                # MongoDB models
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Express middleware
│   │   ├── utils/                 # Utility functions
│   │   └── app.js                 # Express app setup
│   ├── tests/                     # Server tests
│   │   ├── unit/                  # Unit tests
│   │   ├── integration/           # Integration tests
│   │   └── setup.js               # Test setup
│   └── package.json               # Server dependencies
├── jest.config.js                 # Jest configuration
└── package.json                   # Root dependencies
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd week-6-test-debug-assignment-Itchy-Fingers
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install
   
   # Install server dependencies
   cd ../server && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in server directory
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # From root directory
   npm run dev
   ```

## 🧪 Testing Setup

### Running Tests

#### All Tests
```bash
# Run all tests (unit, integration, e2e)
npm test
```

#### Unit Tests
```bash
# Client unit tests
cd client && npm run test:unit

# Server unit tests
cd server && npm run test:unit
```

#### Integration Tests
```bash
# Client integration tests
cd client && npm run test:integration

# Server integration tests
cd server && npm run test:integration
```

#### End-to-End Tests
```bash
# Start the application first
npm run dev

# In another terminal, run E2E tests
cd client && npm run test:e2e
```

#### Coverage Reports
```bash
# Generate coverage reports
npm run test:coverage
```

### Test Structure

#### Client Tests
- **Unit Tests**: `client/src/tests/unit/`
  - `Button.test.jsx` - Button component tests
  - `Form.test.jsx` - Form component tests
  - `PostCard.test.jsx` - Post card component tests

- **Integration Tests**: `client/src/tests/integration/`
  - `App.test.jsx` - App component integration tests

- **E2E Tests**: `client/cypress/e2e/`
  - `app.cy.js` - Full application workflow tests

#### Server Tests
- **Unit Tests**: `server/tests/unit/`
  - `auth.test.js` - Authentication utility tests
  - `validation.test.js` - Validation utility tests

- **Integration Tests**: `server/tests/integration/`
  - `auth.test.js` - Authentication API tests
  - `users.test.js` - User management API tests
  - `posts.test.js` - Post management API tests

## 🔧 Testing Technologies

### Frontend Testing
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **Cypress**: End-to-end testing framework
- **@testing-library/user-event**: User interaction simulation

### Backend Testing
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertion library for API testing
- **mongodb-memory-server**: In-memory MongoDB for testing
- **express-validator**: Input validation testing

## 📊 Test Coverage

The project maintains high test coverage across all components:

- **Unit Tests**: 70%+ coverage
- **Integration Tests**: API endpoint coverage
- **E2E Tests**: Critical user workflow coverage

### Coverage Thresholds
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

## 🐛 Debugging Features

### Client-Side Debugging
- **Error Boundaries**: React error boundary implementation
- **Debug Panel**: Interactive debugging interface
- **Console Logging**: Comprehensive logging system
- **React DevTools**: Component state inspection

### Server-Side Debugging
- **Global Error Handler**: Centralized error handling
- **Request Logging**: Detailed request/response logging
- **Validation Errors**: Comprehensive input validation
- **Database Error Handling**: MongoDB error management

## 🔍 Testing Strategies

### Unit Testing Strategy
1. **Component Testing**: Test React components in isolation
2. **Utility Testing**: Test helper functions and utilities
3. **Mock Dependencies**: Mock external dependencies
4. **Edge Cases**: Test error conditions and edge cases

### Integration Testing Strategy
1. **API Testing**: Test API endpoints with real database
2. **Component Integration**: Test component interactions
3. **Authentication Flow**: Test login/logout workflows
4. **Data Flow**: Test data flow between components

### E2E Testing Strategy
1. **User Workflows**: Test complete user journeys
2. **Cross-browser Testing**: Test in multiple browsers
3. **Performance Testing**: Test application performance
4. **Accessibility Testing**: Test accessibility features

## 📝 Test Documentation

### Writing Tests

#### Unit Test Example
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

#### Integration Test Example
```javascript
import request from 'supertest';
import { app } from '../../src/app';

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
  });
});
```

#### E2E Test Example
```javascript
describe('User Registration', () => {
  it('should register a new user', () => {
    cy.visit('/register');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## 🚨 Error Handling

### Client Error Handling
- **Error Boundaries**: Catch and display React errors
- **Form Validation**: Real-time form validation
- **Network Errors**: Handle API request failures
- **User Feedback**: Clear error messages

### Server Error Handling
- **Global Error Handler**: Centralized error processing
- **Validation Errors**: Input validation with clear messages
- **Database Errors**: MongoDB error handling
- **Authentication Errors**: JWT token validation

## 📈 Performance Monitoring

### Client Performance
- **React Profiler**: Component performance monitoring
- **Bundle Analysis**: Webpack bundle analysis
- **Lighthouse**: Performance auditing
- **Memory Leaks**: Memory usage monitoring

### Server Performance
- **Request Logging**: API performance monitoring
- **Database Queries**: Query performance optimization
- **Memory Usage**: Server memory monitoring
- **Response Times**: API response time tracking

## 🔒 Security Testing

### Authentication Testing
- **JWT Token Validation**: Token verification tests
- **Password Security**: Password hashing tests
- **Session Management**: Session handling tests
- **Authorization**: Role-based access control tests

### Input Validation Testing
- **SQL Injection**: Input sanitization tests
- **XSS Prevention**: Cross-site scripting prevention
- **CSRF Protection**: Cross-site request forgery protection
- **Data Validation**: Input data validation tests

## 🎯 Best Practices

### Test Organization
1. **Arrange**: Set up test data and conditions
2. **Act**: Execute the code being tested
3. **Assert**: Verify the expected outcomes

### Test Naming
- Use descriptive test names
- Follow the pattern: "should [expected behavior] when [condition]"
- Group related tests in describe blocks

### Test Data Management
- Use factories for test data creation
- Clean up test data after each test
- Use isolated test databases
- Mock external dependencies

### Continuous Integration
- Run tests on every commit
- Maintain coverage thresholds
- Automated deployment on test success
- Performance regression testing

## 📚 Additional Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

### Testing Patterns
- [Testing React Components](https://reactjs.org/docs/testing.html)
- [API Testing Best Practices](https://blog.logrocket.com/api-testing-best-practices/)
- [E2E Testing Strategies](https://docs.cypress.io/guides/references/best-practices)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React Testing Library team for excellent testing utilities
- Cypress team for powerful E2E testing framework
- Jest team for the comprehensive testing framework
- MongoDB team for the in-memory testing solution 