import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Form from '../../components/Form';

describe('Form Component', () => {
  const mockOnSubmit = jest.fn();
  const defaultFields = [
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      placeholder: 'Enter username',
      validation: {
        required: true,
        minLength: 3,
        maxLength: 30
      }
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter email',
      validation: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: 'Please enter a valid email address'
      }
    }
  ];

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders form with fields', () => {
    render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('renders form with custom submit text', () => {
    render(
      <Form 
        onSubmit={mockOnSubmit} 
        fields={defaultFields} 
        submitText="Custom Submit"
      />
    );
    
    expect(screen.getByRole('button', { name: /custom submit/i })).toBeInTheDocument();
  });

  it('shows loading state when submitting', async () => {
    const slowSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <Form 
        onSubmit={slowSubmit} 
        fields={defaultFields} 
        loading={true}
      />
    );
    
    expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('displays error message when provided', () => {
    const errorMessage = 'Something went wrong';
    render(
      <Form 
        onSubmit={mockOnSubmit} 
        fields={defaultFields} 
        error={errorMessage}
      />
    );
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toHaveClass('alert-error');
  });

  it('displays success message when provided', () => {
    const successMessage = 'Form submitted successfully';
    render(
      <Form 
        onSubmit={mockOnSubmit} 
        fields={defaultFields} 
        success={successMessage}
      />
    );
    
    expect(screen.getByText(successMessage)).toBeInTheDocument();
    expect(screen.getByText(successMessage)).toHaveClass('alert-success');
  });

  it('validates required fields', async () => {
    render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('username is required')).toBeInTheDocument();
      expect(screen.getByText('email is required')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates minimum length', async () => {
    render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
    
    const usernameInput = screen.getByLabelText('Username');
    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('username must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('validates maximum length', async () => {
    const longUsername = 'a'.repeat(31);
    render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
    
    const usernameInput = screen.getByLabelText('Username');
    fireEvent.change(usernameInput, { target: { value: longUsername } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('username must be no more than 30 characters')).toBeInTheDocument();
    });
  });

  it('validates email pattern', async () => {
    render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
    
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
    
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com'
      });
    });
  });

  it('renders textarea field', () => {
    const fieldsWithTextarea = [
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        placeholder: 'Enter message',
        validation: { required: true }
      }
    ];
    
    render(<Form onSubmit={mockOnSubmit} fields={fieldsWithTextarea} />);
    
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Enter message');
  });

  it('renders select field', () => {
    const fieldsWithSelect = [
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        options: [
          { value: 'tech', label: 'Technology' },
          { value: 'sports', label: 'Sports' }
        ]
      }
    ];
    
    render(<Form onSubmit={mockOnSubmit} fields={fieldsWithSelect} />);
    
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByText('Select Category')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
  });

  it('renders checkbox field', () => {
    const fieldsWithCheckbox = [
      {
        name: 'agree',
        label: 'I agree to terms',
        type: 'checkbox'
      }
    ];
    
    render(<Form onSubmit={mockOnSubmit} fields={fieldsWithCheckbox} />);
    
    expect(screen.getByLabelText('I agree to terms')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('clears error when user starts typing', async () => {
    render(<Form onSubmit={mockOnSubmit} fields={defaultFields} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('username is required')).toBeInTheDocument();
    });
    
    const usernameInput = screen.getByLabelText('Username');
    fireEvent.change(usernameInput, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(screen.queryByText('username is required')).not.toBeInTheDocument();
    });
  });

  it('handles initial data', () => {
    const initialData = {
      username: 'initialuser',
      email: 'initial@example.com'
    };
    
    render(
      <Form 
        onSubmit={mockOnSubmit} 
        fields={defaultFields} 
        initialData={initialData}
      />
    );
    
    expect(screen.getByLabelText('Username')).toHaveValue('initialuser');
    expect(screen.getByLabelText('Email')).toHaveValue('initial@example.com');
  });

  it('handles form submission error', async () => {
    const errorSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    
    render(<Form onSubmit={errorSubmit} fields={defaultFields} />);
    
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(errorSubmit).toHaveBeenCalled();
    });
  });
}); 