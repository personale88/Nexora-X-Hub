'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ClientUser {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
  providers: Array<'google' | 'github'>;
  connectedAccounts: {
    google: {
      connected: boolean;
      email: string | null;
    };
    github: {
      connected: boolean;
      username: string | null;
      avatarUrl: string | null;
      connectedAt: string | null;
      scope: string | null;
    };
  };
}

interface AuthContextType {
  user: ClientUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => void;
  loginWithGitHub: () => void;
  connectGitHub: () => void;
  disconnectGitHub: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isSettingsOpen: boolean;
  openSettings: (tab?: 'engine' | 'connected_accounts') => void;
  closeSettings: () => void;
  settingsTab: 'engine' | 'connected_accounts';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'engine' | 'connected_accounts'>('engine');

  // Verify authenticated session via server-side HttpOnly cookie
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Session verification check failed:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginWithGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  const loginWithGitHub = () => {
    window.location.href = '/api/auth/github';
  };

  const connectGitHub = () => {
    window.location.href = '/api/github/connect';
  };

  const disconnectGitHub = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/github/disconnect', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (res.ok) {
        await refreshSession();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to disconnect GitHub:', err);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      window.location.href = '/';
    }
  };

  const openSettings = (tab: 'engine' | 'connected_accounts' = 'engine') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithGitHub,
        connectGitHub,
        disconnectGitHub,
        logout,
        refreshSession,
        isSettingsOpen,
        openSettings,
        closeSettings,
        settingsTab,
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
