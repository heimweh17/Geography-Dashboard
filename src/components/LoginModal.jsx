import WorkspaceDialog from './WorkspaceDialog';
import React, { useState } from 'react';
import { X, Mail, Lock, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginModal = ({ isOpen, onClose }) => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await signUp(email, password);
        setMessage('Your account has been created successfully. Please sign in.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
   <WorkspaceDialog label="Account access" size="form" onClose={onClose}>
      <div className="bg-white dark:bg-mineral-900 w-full max-w-md rounded-lg shadow-2xl border border-mineral-300 dark:border-mineral-700">
        
        {/* Header */}
        <div className="dialog-heading">
          <h2 className="text-2xl font-bold text-mineral-900 dark:text-mineral-100">
            {loading ? 'Connecting to secure service...' : isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            aria-label="Close" onClick={onClose}
            className="text-mineral-500 hover:text-mineral-700 dark:text-mineral-400 dark:hover:text-mineral-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-800 rounded text-forest-700 dark:text-forest-400 text-sm">
              {message}
            </div>
          )}

          {/* Google Sign In */}
          {/* <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 p-3 mb-4 border-2 border-mineral-300 dark:border-mineral-600 rounded-lg hover:bg-mineral-50 dark:hover:bg-mineral-800 transition disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-semibold text-mineral-700 dark:text-mineral-300">
              Continue with Google
            </span>
          </button> */}

          {/* Divider */}
          {/* <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-mineral-300 dark:border-mineral-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-mineral-900 text-mineral-500">Or continue with email</span>
            </div>
          </div> */}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-mineral-700 dark:text-mineral-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-mineral-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-mineral-300 dark:border-mineral-600 rounded-lg bg-white dark:bg-mineral-800 text-mineral-900 dark:text-mineral-100 focus:ring-2 focus:ring-forest-500 outline-none"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-mineral-700 dark:text-mineral-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-mineral-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 border border-mineral-300 dark:border-mineral-600 rounded-lg bg-white dark:bg-mineral-800 text-mineral-900 dark:text-mineral-100 focus:ring-2 focus:ring-forest-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-mineral-700 dark:text-mineral-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-mineral-400" size={18} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2 border border-mineral-300 dark:border-mineral-600 rounded-lg bg-white dark:bg-mineral-800 text-mineral-900 dark:text-mineral-100 focus:ring-2 focus:ring-forest-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-600 hover:bg-forest-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="animate-spin" size={18} />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-4 text-center text-sm">
            <span className="text-mineral-600 dark:text-mineral-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              className="ml-2 text-forest-600 dark:text-forest-400 font-semibold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </WorkspaceDialog>
  );
};

export default LoginModal;
