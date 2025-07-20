import React, { useState } from 'react';
import Button from './Button';

const Form = ({ 
  onSubmit, 
  initialData = {}, 
  fields = [], 
  submitText = 'Submit',
  loading = false,
  error = null,
  success = null
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateField = (name, value, validation) => {
    if (!validation) return '';
    
    if (validation.required && !value) {
      return `${name} is required`;
    }
    
    if (validation.minLength && value.length < validation.minLength) {
      return `${name} must be at least ${validation.minLength} characters`;
    }
    
    if (validation.maxLength && value.length > validation.maxLength) {
      return `${name} must be no more than ${validation.maxLength} characters`;
    }
    
    if (validation.pattern && !validation.pattern.test(value)) {
      return validation.patternMessage || `${name} format is invalid`;
    }
    
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    
    fields.forEach(field => {
      const error = validateField(field.name, formData[field.name], field.validation);
      if (error) {
        newErrors[field.name] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderField = (field) => {
    const { name, label, type = 'text', placeholder, validation, options = [] } = field;
    const value = formData[name] || '';
    const error = errors[name];
    
    switch (type) {
      case 'textarea':
        return (
          <div key={name} className="form-group">
            <label htmlFor={name}>{label}</label>
            <textarea
              id={name}
              name={name}
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              placeholder={placeholder}
              className={error ? 'form-control error' : 'form-control'}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
        );
        
      case 'select':
        return (
          <div key={name} className="form-group">
            <label htmlFor={name}>{label}</label>
            <select
              id={name}
              name={name}
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              className={error ? 'form-control error' : 'form-control'}
            >
              <option value="">Select {label}</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <span className="error-message">{error}</span>}
          </div>
        );
        
      case 'checkbox':
        return (
          <div key={name} className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name={name}
                checked={value}
                onChange={(e) => handleChange(name, e.target.checked)}
              />
              {label}
            </label>
            {error && <span className="error-message">{error}</span>}
          </div>
        );
        
      default:
        return (
          <div key={name} className="form-group">
            <label htmlFor={name}>{label}</label>
            <input
              id={name}
              name={name}
              type={type}
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              placeholder={placeholder}
              className={error ? 'form-control error' : 'form-control'}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      {fields.map(renderField)}
      
      <div className="form-actions">
        <Button
          type="submit"
          disabled={loading}
          variant="primary"
        >
          {loading ? 'Submitting...' : submitText}
        </Button>
      </div>
    </form>
  );
};

export default Form; 