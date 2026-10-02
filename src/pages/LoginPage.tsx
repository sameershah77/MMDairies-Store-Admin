import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Moon, Sun, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { BrandMark } from '@/components/brand/BrandMark';
import { LoginProductShowcase } from '@/components/brand/LoginProductShowcase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { resetPassword, sendForgotPasswordOtp } from '@/api/auth';
import { ApiError } from '@/lib/apiClient';

type LoginMode = 'signin' | 'forgot-phone' | 'forgot-reset';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const loginHint = (location.state as { login?: string } | null)?.login ?? '';

  const [mode, setMode] = useState<LoginMode>('signin');
  const [username, setUsername] = useState(loginHint);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [forgotPhone, setForgotPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(username, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Login failed');
      toast(res.error || 'Login failed', 'error');
      return;
    }
    toast('Welcome back to M M Dairy');
    navigate('/');
  };

  const handleSendForgotOtp = async (e: FormEvent) => {
    e.preventDefault();
    const phoneNo = forgotPhone.replace(/\D/g, '');
    if (phoneNo.length !== 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendForgotPasswordOtp(phoneNo);
      setOtp('');
      setMode('forgot-reset');
      toast('If this phone is registered, an OTP has been sent.', 'info');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not send OTP';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    const phoneNo = forgotPhone.replace(/\D/g, '');
    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const message = await resetPassword({
        phoneNo,
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      });
      toast(message || 'Password reset successfully. Please sign in.');
      setMode('signin');
      setUsername(phoneNo);
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not reset password';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const year = new Date().getFullYear();

  return (
    <div className="grid h-dvh max-h-dvh overflow-hidden lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 28%, #3fa896 0%, transparent 42%), radial-gradient(circle at 82% 72%, #0a5c5f 0%, transparent 38%)',
          }}
        />

        <div className="relative z-10 px-8 pt-8 xl:px-10 xl:pt-10">
          <BrandMark light size="md" subtitle="Fresh · Daily · Trusted" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pb-4 xl:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <LoginProductShowcase />
            <h2 className="mt-6 font-display text-2xl font-bold text-white xl:text-3xl">
              Run your store with confidence
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-100 xl:text-base">
              Accept live orders, manage products, and keep customers happy — all from one store
              dashboard built for M M Dairy.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 px-8 pb-6 text-xs text-brand-100/90 xl:px-10">
          <p>© {year} M M Dairy. All rights reserved.</p>
          <p className="mt-1">Unauthorized access is prohibited.</p>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-col overflow-y-auto bg-ink-50 px-5 py-6 sm:px-8 sm:py-8">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-4 right-4 z-10 rounded-xl border border-ink-200 bg-surface p-2.5 text-ink-600 shadow-sm transition hover:border-brand-300 hover:text-brand-500"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgba(13,115,119,0.1), transparent 50%), radial-gradient(ellipse at bottom left, rgba(232,168,56,0.07), transparent 45%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative m-auto w-full max-w-[400px]"
        >
          <div className="mb-6 lg:hidden">
            <BrandMark size="sm" subtitle="Store Admin" />
          </div>

          <div className="rounded-3xl border border-ink-100 bg-surface p-6 shadow-xl shadow-ink-900/5 sm:p-8">
            {mode === 'signin' ? (
              <>
                <h1 className="font-display text-2xl font-bold text-ink-900">Welcome back</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                  Sign in with your username or phone number.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <Input
                    label="Username or phone"
                    type="text"
                    placeholder="Enter username or 10-digit number"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    leftIcon={<User className="size-4" />}
                    autoComplete="username"
                    required
                  />
                  <Input
                    label="Password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="size-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="text-ink-400 hover:text-ink-600"
                        tabIndex={-1}
                      >
                        {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    }
                    autoComplete="current-password"
                    required
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                      onClick={() => {
                        setError('');
                        setForgotPhone('');
                        setMode('forgot-phone');
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {error && (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger dark:bg-red-500/15">
                      {error}
                    </p>
                  )}

                  <Button type="submit" size="lg" className="w-full" loading={loading}>
                    Login
                  </Button>
                </form>
              </>
            ) : mode === 'forgot-phone' ? (
              <>
                <h1 className="font-display text-2xl font-bold text-ink-900">Forgot password</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                  Enter the phone number registered with your Store Admin account.
                </p>
                <form onSubmit={handleSendForgotOtp} className="mt-6 space-y-4">
                  <Input
                    label="Phone number"
                    type="tel"
                    placeholder="Enter 10-digit number"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    required
                  />
                  {error && (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger dark:bg-red-500/15">
                      {error}
                    </p>
                  )}
                  <Button type="submit" size="lg" className="w-full" loading={loading}>
                    Send OTP
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-sm font-semibold text-ink-500 hover:text-ink-800"
                    onClick={() => {
                      setError('');
                      setMode('signin');
                    }}
                  >
                    Back to sign in
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold text-ink-900">Reset password</h1>
                <p className="mt-1.5 text-sm text-ink-500">
                  Enter the OTP sent to your phone and choose a new password.
                </p>
                <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                  <Input
                    label="OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    required
                  />
                  <Input
                    label="New password"
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="size-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowNewPass((v) => !v)}
                        className="text-ink-400 hover:text-ink-600"
                        tabIndex={-1}
                      >
                        {showNewPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    }
                    required
                  />
                  <Input
                    label="Confirm password"
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {error && (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger dark:bg-red-500/15">
                      {error}
                    </p>
                  )}
                  <Button type="submit" size="lg" className="w-full" loading={loading}>
                    Reset password
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-sm font-semibold text-ink-500 hover:text-ink-800"
                    onClick={() => {
                      setError('');
                      setMode('forgot-phone');
                    }}
                  >
                    Use a different phone
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-ink-400 lg:hidden">
            © {year} M M Dairy. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
