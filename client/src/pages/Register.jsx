import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserPlus, User, Mail, Lock, Loader2, Link2 } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = 'Username must contain only alphanumeric characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await register(formData.username, formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      showToast('Registration successful!', 'success');
      navigate('/dashboard');
    } else {
      showToast(result.error || 'Registration failed', 'error');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background">
      
      {/* Decorative Glow Elements */}
      <div className="glow-purple top-10 right-10" />
      <div className="glow-blue bottom-10 left-10" />

      {/* Card Wrapper */}
      <div className="relative w-full max-w-md bg-card border border-border/80 p-8 rounded-3xl shadow-xl z-10 animate-in fade-in slide-in-from-bottom-6 duration-300">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex bg-primary/10 p-3 rounded-2xl text-primary">
            <Link2 className="h-7 w-7 transform rotate-45" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Create Account
          </h2>
          <p className="text-sm text-muted-foreground">
            Join now to create and monitor your shortened links
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <User className="h-5 w-5" />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                  errors.username ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-border focus:border-primary'
                }`}
                placeholder="johndoe"
              />
            </div>
            {errors.username && (
              <p className="text-xs font-medium text-rose-500 animate-in fade-in duration-200">
                {errors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                  errors.email ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-border focus:border-primary'
                }`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-rose-500 animate-in fade-in duration-200">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                  errors.password ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-border focus:border-primary'
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-rose-500 animate-in fade-in duration-200">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                  errors.confirmPassword ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-border focus:border-primary'
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs font-medium text-rose-500 animate-in fade-in duration-200">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/95 py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4.5 w-4.5" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footnote */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
