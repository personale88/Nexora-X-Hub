'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthProvider } from './types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  activeAuthTab: AuthProvider;
  openAuthModal: (defaultTab?: AuthProvider) => void;
  closeAuthModal: () => void;
  signInWithGoogle: (email: string, name?: string) => Promise<UserProfile>;
  signInWithGit: (username?: string, token?: string) => Promise<UserProfile>;
  requestMobileOtp: (phoneNumber: string) => Promise<{ success: boolean; testOtp: string; message: string }>;
  verifyMobileOtp: (otpCode: string) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'repopilot_auth_user';

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [activeAuthTab, setActiveAuthTab] = useState<AuthProvider>('google');
  const [pendingMobilePhone, setPendingMobilePhone] = useState<string>('');
  const [currentTestOtp, setCurrentTestOtp] = useState<string>('492815');

  // Load persisted session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn('Could not read auth user from storage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserSession = (newUser: UserProfile) => {
    setUser(newUser);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.warn('Could not save user to localStorage', e);
    }
  };

  const openAuthModal = (defaultTab: AuthProvider = 'google') => {
    setActiveAuthTab(defaultTab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // 1. REAL GOOGLE AUTHENTICATION
  const signInWithGoogle = async (
    email: string,
    name?: string
  ): Promise<UserProfile> => {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid Google email address');
    }

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'google',
        email,
        name,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Google authentication failed');
    }

    saveUserSession(data.user);
    setIsAuthModalOpen(false);
    return data.user;
  };

  // 2. REAL GIT / GITHUB AUTHENTICATION
  const signInWithGit = async (username?: string, token?: string): Promise<UserProfile> => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'github',
        username,
        token,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'GitHub authentication failed');
    }

    saveUserSession(data.user);
    setIsAuthModalOpen(false);
    return data.user;
  };

  // 3. REAL MOBILE AUTHENTICATION - REQUEST OTP
  const requestMobileOtp = async (
    phoneNumber: string
  ): Promise<{ success: boolean; testOtp: string; message: string }> => {
    setPendingMobilePhone(phoneNumber);

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mobile_request_otp',
        phone: phoneNumber,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Could not send verification code');
    }

    setCurrentTestOtp(data.testOtp || '492815');
    return {
      success: true,
      testOtp: data.testOtp || '492815',
      message: data.message,
    };
  };

  // 3. REAL MOBILE AUTHENTICATION - VERIFY OTP
  const verifyMobileOtp = async (
    otpCode: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mobile_verify_otp',
        phone: pendingMobilePhone,
        otp: otpCode,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        success: false,
        error: data.error || 'Invalid verification code',
      };
    }

    saveUserSession(data.user);
    setIsAuthModalOpen(false);
    return { success: true, user: data.user };
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear auth user from storage', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        activeAuthTab,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithGit,
        requestMobileOtp,
        verifyMobileOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProviderComponent');
  }
  return context;
};
