import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../components/AuthContext';
import { UserRole } from '../../types';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: UserRole.STUDENT // Default role
  });

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    // Reset error
    setError(null);

    // Check for empty fields
    if (!formData.username || !formData.name || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }

    // Username validation - alphanumeric only
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    // Password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    // Password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Show success message
      setSuccess(true);

      // Redirect to login after delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background-dark p-4">
      <div className="w-full max-w-md p-8 bg-card-dark rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-text-primary mb-6">Create an Account</h1>

        {error && (
          <div className="bg-error/20 border border-error text-error px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success/20 border border-success text-success px-4 py-3 rounded mb-4">
            Account created successfully! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-text-light mb-1">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-2 rounded bg-background-dark border border-secondary focus:border-primary focus:outline-none text-text-primary"
              placeholder="Enter a unique username"
              disabled={loading || success}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="block text-text-light mb-1">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-background-dark border border-secondary focus:border-primary focus:outline-none text-text-primary"
              placeholder="Enter your full name"
              disabled={loading || success}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="role" className="block text-text-light mb-1">Account Type</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2 rounded bg-background-dark border border-secondary focus:border-primary focus:outline-none text-text-primary"
              disabled={loading || success}
            >
              <option value={UserRole.STUDENT}>Student</option>
              <option value={UserRole.TEACHER}>Teacher</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-text-light mb-1">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 rounded bg-background-dark border border-secondary focus:border-primary focus:outline-none text-text-primary"
              placeholder="Create a password (min. 8 characters)"
              disabled={loading || success}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-text-light mb-1">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-2 rounded bg-background-dark border border-secondary focus:border-primary focus:outline-none text-text-primary"
              placeholder="Confirm your password"
              disabled={loading || success}
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded-md transition-colors disabled:opacity-70"
            disabled={loading || success}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-hover">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

