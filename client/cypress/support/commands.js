// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to wait for element to be visible
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible');
});

// Custom command to wait for element to not exist
Cypress.Commands.add('waitForElementToNotExist', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('not.exist');
});

// Custom command to clear and type
Cypress.Commands.add('clearAndType', (selector, text) => {
  cy.get(selector).clear().type(text);
});

// Custom command to select from dropdown
Cypress.Commands.add('selectFromDropdown', (selector, value) => {
  cy.get(selector).select(value);
});

// Custom command to check if element has class
Cypress.Commands.add('hasClass', (selector, className) => {
  cy.get(selector).should('have.class', className);
});

// Custom command to check if element does not have class
Cypress.Commands.add('doesNotHaveClass', (selector, className) => {
  cy.get(selector).should('not.have.class', className);
});

// Custom command to check if element is disabled
Cypress.Commands.add('isDisabled', (selector) => {
  cy.get(selector).should('be.disabled');
});

// Custom command to check if element is enabled
Cypress.Commands.add('isEnabled', (selector) => {
  cy.get(selector).should('not.be.disabled');
});

// Custom command to check if element is checked
Cypress.Commands.add('isChecked', (selector) => {
  cy.get(selector).should('be.checked');
});

// Custom command to check if element is not checked
Cypress.Commands.add('isNotChecked', (selector) => {
  cy.get(selector).should('not.be.checked');
});

// Custom command to wait for loading to complete
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist');
});

// Custom command to wait for success message
Cypress.Commands.add('waitForSuccess', (message) => {
  cy.get('[data-testid="success-message"]', { timeout: 10000 })
    .should('be.visible')
    .and('contain', message);
});

// Custom command to wait for error message
Cypress.Commands.add('waitForError', (message) => {
  cy.get('[data-testid="error-message"]', { timeout: 10000 })
    .should('be.visible')
    .and('contain', message);
});

// Custom command to wait for toast notification
Cypress.Commands.add('waitForToast', (message) => {
  cy.get('.toast', { timeout: 10000 })
    .should('be.visible')
    .and('contain', message);
});

// Custom command to wait for modal to be visible
Cypress.Commands.add('waitForModal', () => {
  cy.get('[data-testid="modal"]', { timeout: 10000 }).should('be.visible');
});

// Custom command to close modal
Cypress.Commands.add('closeModal', () => {
  cy.get('[data-testid="modal-close"]').click();
  cy.get('[data-testid="modal"]').should('not.exist');
});

// Custom command to wait for form validation
Cypress.Commands.add('waitForValidation', () => {
  cy.get('[data-testid="validation-error"]', { timeout: 5000 }).should('be.visible');
});

// Custom command to check if element has attribute
Cypress.Commands.add('hasAttribute', (selector, attribute, value) => {
  cy.get(selector).should('have.attr', attribute, value);
});

// Custom command to check if element has data attribute
Cypress.Commands.add('hasDataAttribute', (selector, attribute, value) => {
  cy.get(selector).should('have.data', attribute, value);
});

// Custom command to wait for network request
Cypress.Commands.add('waitForRequest', (method, url) => {
  cy.intercept(method, url).as('request');
  cy.wait('@request');
});

// Custom command to wait for multiple requests
Cypress.Commands.add('waitForRequests', (requests) => {
  requests.forEach(({ method, url, alias }) => {
    cy.intercept(method, url).as(alias);
  });
  requests.forEach(({ alias }) => {
    cy.wait(`@${alias}`);
  });
});

// Custom command to mock API response
Cypress.Commands.add('mockApiResponse', (method, url, response) => {
  cy.intercept(method, url, response).as('mockedRequest');
});

// Custom command to wait for page to load completely
Cypress.Commands.add('waitForPageLoad', () => {
  cy.window().should('have.property', 'React');
  cy.get('body').should('be.visible');
  cy.get('[data-testid="loading"]').should('not.exist');
});

// Custom command to scroll to element
Cypress.Commands.add('scrollToElement', (selector) => {
  cy.get(selector).scrollIntoView();
});

// Custom command to wait for element to be in viewport
Cypress.Commands.add('waitForElementInViewport', (selector) => {
  cy.get(selector).should('be.visible').and('be.inViewport');
});

// Custom command to check if element is focused
Cypress.Commands.add('isFocused', (selector) => {
  cy.get(selector).should('be.focused');
});

// Custom command to check if element is not focused
Cypress.Commands.add('isNotFocused', (selector) => {
  cy.get(selector).should('not.be.focused');
});

// Custom command to wait for element to be focused
Cypress.Commands.add('waitForFocus', (selector) => {
  cy.get(selector).should('be.focused');
});

// Custom command to wait for element to lose focus
Cypress.Commands.add('waitForBlur', (selector) => {
  cy.get(selector).should('not.be.focused');
});

// Custom command to check if element has value
Cypress.Commands.add('hasValue', (selector, value) => {
  cy.get(selector).should('have.value', value);
});

// Custom command to check if element does not have value
Cypress.Commands.add('doesNotHaveValue', (selector, value) => {
  cy.get(selector).should('not.have.value', value);
});

// Custom command to wait for element to have value
Cypress.Commands.add('waitForValue', (selector, value) => {
  cy.get(selector).should('have.value', value);
});

// Custom command to wait for element to not have value
Cypress.Commands.add('waitForNoValue', (selector) => {
  cy.get(selector).should('have.value', '');
});

// Custom command to check if element contains text
Cypress.Commands.add('containsText', (selector, text) => {
  cy.get(selector).should('contain', text);
});

// Custom command to check if element does not contain text
Cypress.Commands.add('doesNotContainText', (selector, text) => {
  cy.get(selector).should('not.contain', text);
});

// Custom command to wait for element to contain text
Cypress.Commands.add('waitForText', (selector, text) => {
  cy.get(selector).should('contain', text);
});

// Custom command to wait for element to not contain text
Cypress.Commands.add('waitForNoText', (selector, text) => {
  cy.get(selector).should('not.contain', text);
}); 