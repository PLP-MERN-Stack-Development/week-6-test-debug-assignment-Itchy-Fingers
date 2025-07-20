describe('MERN Testing Assignment App', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForPageLoad();
  });

  describe('Navigation and Layout', () => {
    it('should display the main application', () => {
      cy.contains('MERN Testing Assignment').should('be.visible');
      cy.contains('Welcome to the testing and debugging demonstration app.').should('be.visible');
    });

    it('should navigate between Home and About views', () => {
      // Initially on Home view
      cy.contains('Button Component Demo').should('be.visible');
      
      // Navigate to About
      cy.get('button').contains('About').click();
      cy.contains('About This Project').should('be.visible');
      cy.contains('This is a comprehensive testing and debugging demonstration').should('be.visible');
      
      // Navigate back to Home
      cy.get('button').contains('Home').click();
      cy.contains('Button Component Demo').should('be.visible');
    });

    it('should handle navigation button states', () => {
      // Initially Home button should be primary (active)
      cy.get('button').contains('Home').should('have.class', 'btn-primary');
      
      // About button should be secondary (inactive)
      cy.get('button').contains('About').should('have.class', 'btn-secondary');
      
      // Click About and check states change
      cy.get('button').contains('About').click();
      cy.get('button').contains('About').should('have.class', 'btn-primary');
      cy.get('button').contains('Home').should('have.class', 'btn-secondary');
    });
  });

  describe('Button Component Demo', () => {
    it('should display all button variants', () => {
      cy.contains('Button Component Demo').should('be.visible');
      cy.get('button').contains('Primary Button').should('be.visible');
      cy.get('button').contains('Secondary Button').should('be.visible');
      cy.get('button').contains('Danger Button').should('be.visible');
      cy.get('button').contains('Success Button').should('be.visible');
      cy.get('button').contains('Disabled Button').should('be.visible');
    });

    it('should handle button click events', () => {
      // Test primary button
      cy.get('button').contains('Primary Button').click();
      
      // Test secondary button
      cy.get('button').contains('Secondary Button').click();
      
      // Test danger button
      cy.get('button').contains('Danger Button').click();
      
      // Test success button
      cy.get('button').contains('Success Button').click();
      
      // All buttons should be clickable without errors
      cy.checkForErrors();
    });

    it('should have correct button styles', () => {
      cy.get('button').contains('Primary Button').should('have.class', 'btn-primary');
      cy.get('button').contains('Secondary Button').should('have.class', 'btn-secondary');
      cy.get('button').contains('Danger Button').should('have.class', 'btn-danger');
      cy.get('button').contains('Success Button').should('have.class', 'btn-success');
      cy.get('button').contains('Disabled Button').should('be.disabled');
    });
  });

  describe('Form Component Demo', () => {
    it('should display form fields', () => {
      cy.contains('Form Component Demo').should('be.visible');
      cy.get('label').contains('Username').should('be.visible');
      cy.get('label').contains('Email').should('be.visible');
      cy.get('label').contains('Message').should('be.visible');
      cy.get('button').contains('Submit Form').should('be.visible');
    });

    it('should handle form field interactions', () => {
      const usernameInput = cy.get('input[name="username"]');
      const emailInput = cy.get('input[name="email"]');
      const messageInput = cy.get('textarea[name="message"]');
      
      // Test typing in fields
      usernameInput.type('testuser');
      emailInput.type('test@example.com');
      messageInput.type('This is a test message');
      
      // Check values
      usernameInput.should('have.value', 'testuser');
      emailInput.should('have.value', 'test@example.com');
      messageInput.should('have.value', 'This is a test message');
      
      // Test clearing fields
      usernameInput.clear();
      emailInput.clear();
      messageInput.clear();
      
      usernameInput.should('have.value', '');
      emailInput.should('have.value', '');
      messageInput.should('have.value', '');
    });

    it('should validate form fields', () => {
      // Try to submit without filling required fields
      cy.get('button').contains('Submit Form').click();
      
      // Should show validation errors
      cy.contains('username is required').should('be.visible');
      cy.contains('email is required').should('be.visible');
      cy.contains('message is required').should('be.visible');
    });

    it('should submit form successfully', () => {
      // Fill out the form
      cy.get('input[name="username"]').type('testuser');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('textarea[name="message"]').type('This is a test message');
      
      // Submit the form
      cy.get('button').contains('Submit Form').click();
      
      // Check that form was submitted (console.log should be called)
      // Note: In a real app, this would trigger an API call
      cy.checkForErrors();
    });

    it('should validate email format', () => {
      cy.get('input[name="username"]').type('testuser');
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('textarea[name="message"]').type('Test message');
      
      cy.get('button').contains('Submit Form').click();
      
      // Should show email validation error
      cy.contains('Please enter a valid email').should('be.visible');
    });
  });

  describe('Post Cards Demo', () => {
    it('should display post cards', () => {
      cy.contains('Post Cards Demo').should('be.visible');
      
      // Wait for posts to load
      cy.contains('Loading posts...').should('be.visible');
      cy.contains('Getting Started with React Testing').should('be.visible');
      cy.contains('Advanced Jest Configuration').should('be.visible');
    });

    it('should display post statistics correctly', () => {
      cy.contains('Getting Started with React Testing').should('be.visible');
      
      // Check for post statistics
      cy.contains('150 views').should('be.visible');
      cy.contains('2 likes').should('be.visible');
      cy.contains('2 comments').should('be.visible');
      cy.contains('3 min read').should('be.visible');
    });

    it('should display post tags correctly', () => {
      cy.contains('Getting Started with React Testing').should('be.visible');
      
      // Check for tags
      cy.contains('react').should('be.visible');
      cy.contains('testing').should('be.visible');
      cy.contains('javascript').should('be.visible');
    });

    it('should handle post interactions', () => {
      cy.contains('Getting Started with React Testing').should('be.visible');
      
      // Test like button
      cy.get('button').contains('Like').first().click();
      
      // Test comment button
      cy.get('button').contains('Comment').first().click();
      
      // Test edit button (if available for author)
      cy.get('button').contains('Edit').should('exist');
      
      // All interactions should work without errors
      cy.checkForErrors();
    });

    it('should handle post deletion', () => {
      cy.contains('Getting Started with React Testing').should('be.visible');
      
      // Find and click delete button (should be available for author)
      cy.get('button').contains('Delete').first().click();
      
      // Check that delete action was logged
      cy.checkForErrors();
    });
  });

  describe('Debug Panel', () => {
    it('should toggle debug panel', () => {
      // Debug panel should not be visible initially
      cy.contains('Debug Panel').should('not.exist');
      
      // Click debug button
      cy.get('button').contains('Debug').click();
      
      // Debug panel should be visible
      cy.contains('Debug Panel').should('be.visible');
      
      // Close debug panel
      cy.get('button').contains('Close').click();
      
      // Debug panel should be hidden
      cy.contains('Debug Panel').should('not.exist');
    });

    it('should display debug information', () => {
      // Open debug panel
      cy.get('button').contains('Debug').click();
      
      // Check for debug information
      cy.contains('Debug Panel').should('be.visible');
      cy.contains('Current State:').should('be.visible');
      cy.contains('Error Count:').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      // The app should not show any error messages on normal operation
      cy.contains('Something went wrong.').should('not.exist');
      cy.contains('Error').should('not.exist');
    });

    it('should display error boundaries when needed', () => {
      // Test that error boundaries work by checking the structure
      cy.get('main').should('exist');
      cy.get('main').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should handle different screen sizes', () => {
      // Test desktop view
      cy.viewport(1280, 720);
      cy.get('main').should('be.visible');
      
      // Test tablet view
      cy.viewport(768, 1024);
      cy.get('main').should('be.visible');
      
      // Test mobile view
      cy.viewport(375, 667);
      cy.get('main').should('be.visible');
    });

    it('should have proper navigation structure', () => {
      cy.get('nav').should('exist');
      cy.get('nav').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load quickly', () => {
      cy.visit('/', { timeout: 10000 });
      cy.waitForPageLoad();
      
      // Check that loading is complete
      cy.contains('Loading posts...').should('not.exist');
    });

    it('should handle multiple interactions without performance issues', () => {
      // Test multiple button clicks
      for (let i = 0; i < 5; i++) {
        cy.get('button').contains('Primary Button').click();
        cy.get('button').contains('Secondary Button').click();
      }
      
      // App should still be responsive
      cy.checkForErrors();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Check for proper form labels
      cy.get('input[name="username"]').should('have.attr', 'id');
      cy.get('label[for]').should('exist');
    });

    it('should have proper button roles', () => {
      cy.get('button').should('have.attr', 'type');
    });

    it('should be keyboard navigable', () => {
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('exist');
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should work in different browsers', () => {
      // This test would be run in different browsers in CI/CD
      cy.checkForErrors();
      cy.contains('MERN Testing Assignment').should('be.visible');
    });
  });
}); 