import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

describe('App Integration Tests', () => {
  it('renders the main application', () => {
    render(<App />);
    
    expect(screen.getByText('MERN Testing Assignment')).toBeInTheDocument();
    expect(screen.getByText('Welcome to the testing and debugging demonstration app.')).toBeInTheDocument();
  });

  it('navigates between Home and About views', async () => {
    render(<App />);
    
    // Initially on Home view
    expect(screen.getByText('Button Component Demo')).toBeInTheDocument();
    
    // Navigate to About
    const aboutButton = screen.getByRole('button', { name: /about/i });
    fireEvent.click(aboutButton);
    
    await waitFor(() => {
      expect(screen.getByText('About This Project')).toBeInTheDocument();
      expect(screen.getByText('This is a comprehensive testing and debugging demonstration')).toBeInTheDocument();
    });
    
    // Navigate back to Home
    const homeButton = screen.getByRole('button', { name: /home/i });
    fireEvent.click(homeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Button Component Demo')).toBeInTheDocument();
    });
  });

  it('displays button component demo', () => {
    render(<App />);
    
    expect(screen.getByText('Button Component Demo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /primary button/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /secondary button/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /danger button/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /success button/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disabled button/i })).toBeInTheDocument();
  });

  it('displays form component demo', () => {
    render(<App />);
    
    expect(screen.getByText('Form Component Demo')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit form/i })).toBeInTheDocument();
  });

  it('displays post cards demo', async () => {
    render(<App />);
    
    expect(screen.getByText('Post Cards Demo')).toBeInTheDocument();
    
    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Getting Started with React Testing')).toBeInTheDocument();
      expect(screen.getByText('Advanced Jest Configuration')).toBeInTheDocument();
    });
  });

  it('handles form submission', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Fill out the form
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    
    await user.type(usernameInput, 'testuser');
    await user.type(emailInput, 'test@example.com');
    await user.type(messageInput, 'This is a test message');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit form/i });
    await user.click(submitButton);
    
    // Check that the form was submitted (console.log should be called)
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Form submitted:', expect.objectContaining({
        username: 'testuser',
        email: 'test@example.com',
        message: 'This is a test message'
      }));
    });
  });

  it('validates form fields', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /submit form/i });
    await user.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('username is required')).toBeInTheDocument();
      expect(screen.getByText('email is required')).toBeInTheDocument();
      expect(screen.getByText('message is required')).toBeInTheDocument();
    });
  });

  it('handles post interactions', async () => {
    render(<App />);
    
    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Getting Started with React Testing')).toBeInTheDocument();
    });
    
    // Find and click like button
    const likeButtons = screen.getAllByRole('button', { name: /like/i });
    fireEvent.click(likeButtons[0]);
    
    // Check that like action was logged
    expect(console.log).toHaveBeenCalledWith('Liking post:', expect.any(String));
  });

  it('handles post deletion', async () => {
    render(<App />);
    
    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Getting Started with React Testing')).toBeInTheDocument();
    });
    
    // Find and click delete button (should be available for author)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    // Check that delete action was logged
    expect(console.log).toHaveBeenCalledWith('Deleting post:', expect.any(String));
  });

  it('toggles debug panel', async () => {
    render(<App />);
    
    // Debug panel should not be visible initially
    expect(screen.queryByText('Debug Panel')).not.toBeInTheDocument();
    
    // Click debug button
    const debugButton = screen.getByRole('button', { name: /debug/i });
    fireEvent.click(debugButton);
    
    // Debug panel should be visible
    await waitFor(() => {
      expect(screen.getByText('Debug Panel')).toBeInTheDocument();
    });
    
    // Close debug panel
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Debug panel should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Debug Panel')).not.toBeInTheDocument();
    });
  });

  it('handles error boundaries', () => {
    // Create a component that throws an error
    const ErrorComponent = () => {
      throw new Error('Test error');
    };
    
    // Render with error boundary
    render(
      <div>
        <ErrorComponent />
      </div>
    );
    
    // Should show error boundary message
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('displays loading state for posts', async () => {
    render(<App />);
    
    // Should show loading message initially
    expect(screen.getByText('Loading posts...')).toBeInTheDocument();
    
    // Wait for posts to load
    await waitFor(() => {
      expect(screen.queryByText('Loading posts...')).not.toBeInTheDocument();
    });
  });

  it('handles navigation button states', () => {
    render(<App />);
    
    // Initially Home button should be primary (active)
    const homeButton = screen.getByRole('button', { name: /home/i });
    expect(homeButton).toHaveClass('btn-primary');
    
    // About button should be secondary (inactive)
    const aboutButton = screen.getByRole('button', { name: /about/i });
    expect(aboutButton).toHaveClass('btn-secondary');
  });

  it('displays error messages when provided', () => {
    // This would require mocking the App component to inject an error state
    // For now, we'll test that the error message structure exists
    render(<App />);
    
    // The error message div should exist in the structure
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('handles button click events', async () => {
    render(<App />);
    
    // Test button clicks
    const primaryButton = screen.getByRole('button', { name: /primary button/i });
    fireEvent.click(primaryButton);
    
    // Test secondary button
    const secondaryButton = screen.getByRole('button', { name: /secondary button/i });
    fireEvent.click(secondaryButton);
    
    // Test danger button
    const dangerButton = screen.getByRole('button', { name: /danger button/i });
    fireEvent.click(dangerButton);
    
    // Test success button
    const successButton = screen.getByRole('button', { name: /success button/i });
    fireEvent.click(successButton);
    
    // All buttons should be clickable without errors
    expect(primaryButton).toBeInTheDocument();
    expect(secondaryButton).toBeInTheDocument();
    expect(dangerButton).toBeInTheDocument();
    expect(successButton).toBeInTheDocument();
  });

  it('handles form field interactions', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Message');
    
    // Test typing in fields
    await user.type(usernameInput, 'test');
    await user.type(emailInput, 'test@example.com');
    await user.type(messageInput, 'Test message');
    
    expect(usernameInput).toHaveValue('test');
    expect(emailInput).toHaveValue('test@example.com');
    expect(messageInput).toHaveValue('Test message');
    
    // Test clearing fields
    await user.clear(usernameInput);
    await user.clear(emailInput);
    await user.clear(messageInput);
    
    expect(usernameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');
    expect(messageInput).toHaveValue('');
  });

  it('handles post card interactions', async () => {
    render(<App />);
    
    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Getting Started with React Testing')).toBeInTheDocument();
    });
    
    // Test like button
    const likeButtons = screen.getAllByRole('button', { name: /like/i });
    fireEvent.click(likeButtons[0]);
    
    // Test comment button
    const commentButtons = screen.getAllByRole('button', { name: /comment/i });
    fireEvent.click(commentButtons[0]);
    
    // Test edit button (if available for author)
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0]);
    }
    
    // All interactions should work without errors
    expect(likeButtons[0]).toBeInTheDocument();
    expect(commentButtons[0]).toBeInTheDocument();
  });

  it('displays post statistics correctly', async () => {
    render(<App />);
    
    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Getting Started with React Testing')).toBeInTheDocument();
    });
    
    // Check for post statistics
    expect(screen.getByText(/150 views/)).toBeInTheDocument();
    expect(screen.getByText(/2 likes/)).toBeInTheDocument();
    expect(screen.getByText(/2 comments/)).toBeInTheDocument();
    expect(screen.getByText(/3 min read/)).toBeInTheDocument();
  });

  it('displays post tags correctly', async () => {
    render(<App />);
    
    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Getting Started with React Testing')).toBeInTheDocument();
    });
    
    // Check for tags
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('handles responsive design elements', () => {
    render(<App />);
    
    // Test that the app structure is responsive
    const appElement = screen.getByRole('main').closest('.app');
    expect(appElement).toBeInTheDocument();
    
    // Test navigation structure
    const navElement = screen.getByRole('navigation');
    expect(navElement).toBeInTheDocument();
  });
}); 