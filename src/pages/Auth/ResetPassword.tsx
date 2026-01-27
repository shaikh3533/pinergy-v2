import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaKey, FaEye, FaEyeSlash, FaTableTennis } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check URL hash for recovery token
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (type === 'recovery' && accessToken) {
        // Set the session with the recovery token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });

        if (!error) {
          setIsValidSession(true);
        }
      } else if (session) {
        setIsValidSession(true);
      }

      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(`Failed to reset password: ${error.message}`);
      } else {
        toast.success('Password reset successfully! You can now login.');
        navigate('/auth/signin');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error('An unexpected error occurred');
    }

    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <FaTableTennis className="text-6xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Invalid or Expired Link</h2>
          <p className="text-gray-400 mb-6">
            This password reset link is invalid or has expired. Please request a new password reset link.
          </p>
          <button
            onClick={() => navigate('/auth/signin')}
            className="btn-primary"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <FaKey className="text-5xl text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Reset Your Password</h1>
          <p className="text-gray-400">Enter your new password below</p>
        </div>

        <div className="card">
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Enter new password (min 6 characters)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Re-enter new password"
                required
              />
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-red-400 text-sm">Passwords do not match</p>
            )}

            {password && password.length < 6 && (
              <p className="text-yellow-400 text-sm">Password must be at least 6 characters</p>
            )}

            <button
              type="submit"
              disabled={loading || password.length < 6 || password !== confirmPassword}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <FaKey /> Reset Password
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
