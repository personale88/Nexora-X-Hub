'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Phone,
  Mail,
  User,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AuthProvider } from '@/lib/types';

// Authentic SVG for Google Multi-Color Icon
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

// Authentic SVG for GitHub
const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
];

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    activeAuthTab,
    signInWithGoogle,
    signInWithGit,
    requestMobileOtp,
    verifyMobileOtp,
  } = useAuth();

  const [selectedTab, setSelectedTab] = useState<AuthProvider>(activeAuthTab);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Google Form State
  const [googleEmail, setGoogleEmail] = useState<string>('personale88@gmail.com');
  const [googleName, setGoogleName] = useState<string>('Vignesh B');

  // Git Form State
  const [gitUsername, setGitUsername] = useState<string>('personale88');

  // Mobile Auth State
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [mobileNumber, setMobileNumber] = useState<string>('9876543210');
  const [mobileStep, setMobileStep] = useState<'input_phone' | 'input_otp'>('input_phone');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [activeTestOtp, setActiveTestOtp] = useState<string>('492815');

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync tab with context trigger
  useEffect(() => {
    if (activeAuthTab) {
      setSelectedTab(activeAuthTab);
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [activeAuthTab, isAuthModalOpen]);

  // Timer for OTP countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mobileStep === 'input_otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mobileStep, resendTimer]);

  if (!isAuthModalOpen) return null;

  // Handle Google Login
  const handleGoogleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle(googleEmail, googleName);
      setSuccessMessage('Successfully signed in with Google!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate with Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Git Login
  const handleGitSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGit(gitUsername);
      setSuccessMessage(`Successfully connected GitHub account @${gitUsername}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate with Git provider');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Mobile Step 1: Send OTP
  const handleSendMobileOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    if (cleanNumber.length < 8) {
      setErrorMessage('Please enter a valid mobile number');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const fullPhone = `${countryCode} ${cleanNumber}`;
      const res = await requestMobileOtp(fullPhone);
      setActiveTestOtp(res.testOtp);
      setMobileStep('input_otp');
      setResendTimer(30);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Mobile Step 2: Verify OTP
  const handleVerifyOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await verifyMobileOtp(fullCode);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid verification code');
      } else {
        setSuccessMessage('Phone verified successfully! You are now logged in.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle digit input in OTP boxes
  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // User pasted full code
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const fillTestOtpCode = () => {
    const digits = activeTestOtp.split('');
    setOtpDigits(digits);
    otpInputRefs.current[5]?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Sign In to RepoPilot
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Select your authentication provider to connect your codebase and save fixes.
            </p>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provider Switcher Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedTab('google');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              selectedTab === 'google'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GoogleIcon className="w-4 h-4" />
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTab('git');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              selectedTab === 'git'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GithubIcon className="w-4 h-4 text-slate-900" />
            <span>Git / GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTab('mobile');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              selectedTab === 'mobile'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Mobile OTP</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 space-y-4">
          {/* Error / Success Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. GOOGLE SIGN IN */}
          {selectedTab === 'google' && (
            <div className="space-y-4">
              <div className="text-center py-2 space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto shadow-2xs">
                  <GoogleIcon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Sign in with Google OAuth</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Instant secure single sign-on with your Google developer profile.
                </p>
              </div>

              {/* Fast 1-Click Google Button */}
              <button
                type="button"
                onClick={() => handleGoogleSubmit()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs shadow-xs hover:border-slate-400 transition-all cursor-pointer group"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                ) : (
                  <GoogleIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                )}
                <span>Continue with Google ({googleName})</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold absolute">
                  or choose account
                </span>
              </div>

              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="e.g. Vignesh B"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Google Email</span>
                  </label>
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="name@gmail.com"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Google OAuth 2.0 encrypted token verification protocol active.</span>
              </div>
            </div>
          )}

          {/* 2. GIT / GITHUB SIGN IN */}
          {selectedTab === 'git' && (
            <div className="space-y-4">
              <div className="text-center py-2 space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
                  <GithubIcon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Sign in with Git Provider</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Sync with your GitHub repositories, pull requests, and verified commit history.
                </p>
              </div>

              {/* Fast 1-Click GitHub Button */}
              <button
                type="button"
                onClick={() => handleGitSubmit()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all cursor-pointer group"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <GithubIcon className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                )}
                <span>Authorize with GitHub (@{gitUsername})</span>
              </button>

              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>GitHub Username</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">github.com/{gitUsername}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">@</span>
                    <input
                      type="text"
                      value={gitUsername}
                      onChange={(e) => setGitUsername(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      placeholder="personale88"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600">
                  <span className="font-medium">Active Repo Link:</span>
                  <span className="font-mono text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Nexora-X-Hub
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Provides read/write access to open PRs and automated patches.</span>
              </div>
            </div>
          )}

          {/* 3. MOBILE AUTHENTICATION */}
          {selectedTab === 'mobile' && (
            <div className="space-y-4">
              {mobileStep === 'input_phone' ? (
                /* Step 1: Input Phone Number */
                <form onSubmit={handleSendMobileOtp} className="space-y-4">
                  <div className="text-center py-2 space-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Mobile Authentication</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Enter your phone number to receive a 6-digit SMS verification code.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Phone Number</span>
                    </label>

                    <div className="flex items-center gap-2">
                      {/* Country Code Picker */}
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-32 px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code} ({c.country})
                          </option>
                        ))}
                      </select>

                      {/* Phone Number Input */}
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="9876543210"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !mobileNumber.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Instant Testing Ready
                    </span>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-indigo-200 font-semibold text-indigo-700">
                      Code: 492815
                    </span>
                  </div>
                </form>
              ) : (
                /* Step 2: 6-Digit OTP Verification */
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4 animate-in fade-in">
                  <div className="text-center py-1 space-y-1">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Enter Verification Code</h3>
                    <p className="text-xs text-slate-500">
                      Sent to{' '}
                      <span className="font-semibold text-slate-800 font-mono">
                        {countryCode} {mobileNumber}
                      </span>
                    </p>
                  </div>

                  {/* 6 Digit Inputs */}
                  <div className="flex justify-center gap-2 my-2">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className={`w-11 h-12 text-center text-lg font-bold font-mono rounded-xl border transition-all focus:outline-none ${
                          digit
                            ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                            : 'border-slate-300 bg-white text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Demo Helper Badge (Instant fill) */}
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>💡 Demo Code:</span>
                      <span className="font-mono font-bold tracking-wider text-amber-800">
                        {activeTestOtp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={fillTestOtpCode}
                      className="px-2 py-0.5 rounded-md bg-amber-200/70 hover:bg-amber-300/80 font-bold text-[11px] text-amber-900 transition-colors"
                    >
                      Auto-Fill Code
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.join('').length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Complete Sign In</span>
                      </>
                    )}
                  </button>

                  {/* Footer actions: Resend & Edit Number */}
                  <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => setMobileStep('input_phone')}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Change Phone Number
                    </button>

                    <button
                      type="button"
                      disabled={resendTimer > 0}
                      onClick={() => {
                        setResendTimer(30);
                        setActiveTestOtp('492815');
                      }}
                      className={`flex items-center gap-1 ${
                        resendTimer > 0
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-indigo-600 hover:text-indigo-800 font-semibold'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{resendTimer > 0 ? `Resend code (${resendTimer}s)` : 'Resend code'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400">
          <span>Encrypted with 256-bit TLS</span>
          <span>RepoPilot v2.4 · Privacy & Terms</span>
        </div>
      </div>
    </div>
  );
};
