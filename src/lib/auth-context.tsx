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
  signInWithGoogle: (email?: string, name?: string) => Promise<UserProfile>;
  signInWithGit: (username?: string) => Promise<UserProfile>;
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
        // Default demo session for immediate smooth testing if desired
        const defaultUser: UserProfile = {
          id: 'user_personale88',
          name: 'personale88',
          email: 'personale88@users.noreply.github.com',
          avatar: 'https://avatars.githubusercontent.com/u/214250353?v=4',
          provider: 'git',
          role: 'Repository Owner & Lead Architect',
          gitUsername: 'personale88',
          verifiedAt: new Date().toLocaleTimeString(),
        };
        setUser(defaultUser);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultUser));
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

  // 1. Google Authentication
  const signInWithGoogle = async (
    email: string = 'personale88@gmail.com',
    name: string = 'Vignesh B'
  ): Promise<UserProfile> => {
    // Simulate real OAuth handshake
    await new Promise((res) => setTimeout(res, 800));

    const googleUser: UserProfile = {
      id: `google_${Date.now()}`,
      name: name,
      email: email,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      provider: 'google',
      role: 'Verified Google Developer',
      verifiedAt: new Date().toLocaleTimeString(),
    };

    saveUserSession(googleUser);
    setIsAuthModalOpen(false);
    return googleUser;
  };

  // 2. Git / GitHub Authentication
  const signInWithGit = async (username: string = 'personale88'): Promise<UserProfile> => {
    await new Promise((res) => setTimeout(res, 800));

    const gitUser: UserProfile = {
      id: `git_${username.toLowerCase()}`,
      name: username,
      email: `${username}@users.noreply.github.com`,
      avatar: username.toLowerCase() === 'personale88'
        ? 'https://avatars.githubusercontent.com/u/214250353?v=4'
        : `https://github.com/${username}.png`,
      provider: 'git',
      role: 'GitHub Contributor',
      gitUsername: username,
      verifiedAt: new Date().toLocaleTimeString(),
    };

    saveUserSession(gitUser);
    setIsAuthModalOpen(false);
    return gitUser;
  };

  // 3. Mobile Authentication - Request OTP
  const requestMobileOtp = async (
    phoneNumber: string
  ): Promise<{ success: boolean; testOtp: string; message: string }> => {
    await new Promise((res) => setTimeout(res, 600));

    // Generate deterministic 6-digit OTP code for instant demo
    const generatedCode = '492815';
    setPendingMobilePhone(phoneNumber);
    setCurrentTestOtp(generatedCode);

    return {
      success: true,
      testOtp: generatedCode,
      message: `Verification code sent to ${phoneNumber}`,
    };
  };

  // 3. Mobile Authentication - Verify OTP
  const verifyMobileOtp = async (
    otpCode: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    await new Promise((res) => setTimeout(res, 700));

    if (otpCode !== currentTestOtp && otpCode !== '123456' && otpCode !== '492815') {
      return {
        success: false,
        error: 'Invalid 6-digit verification code. Please check and try again.',
      };
    }

    const phoneUser: UserProfile = {
      id: `mobile_${Date.now()}`,
      name: `User ${pendingMobilePhone.slice(-4) || '9876'}`,
      phone: pendingMobilePhone || '+91 98765 43210',
      provider: 'mobile',
      role: 'SMS Verified Developer',
      verifiedAt: new Date().toLocaleTimeString(),
    };

    saveUserSession(phoneUser);
    setIsAuthModalOpen(false);
    return { success: true, user: phoneUser };
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
