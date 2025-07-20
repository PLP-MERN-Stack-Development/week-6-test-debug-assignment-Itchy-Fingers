// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Custom command to wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.window().should('have.property', 'React');
});

// Custom command to login
Cypress.Commands.add('login', (username = 'testuser', password = 'Password123') => {
  cy.visit('/');
  cy.get('[data-testid="login-form"]').within(() => {
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
  });
  cy.url().should('include', '/dashboard');
});

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/');
});

// Custom command to create a post
Cypress.Commands.add('createPost', (title, content) => {
  cy.visit('/posts/new');
  cy.get('input[name="title"]').type(title);
  cy.get('textarea[name="content"]').type(content);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/posts/');
});

// Custom command to check for error messages
Cypress.Commands.add('checkForErrors', () => {
  cy.get('body').should('not.contain', 'Something went wrong');
  cy.get('body').should('not.contain', 'Error');
});

// Custom command to wait for API requests
Cypress.Commands.add('waitForApi', (method, url) => {
  cy.intercept(method, url).as('apiRequest');
  cy.wait('@apiRequest');
});

// Override visit to add error checking
const originalVisit = Cypress.Commands._commands.visit;
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  return originalFn(url, options).then(() => {
    cy.checkForErrors();
  });
}); 