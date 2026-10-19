import type { User } from '@base44/sdk';
import { asError } from '@/lib/errors';
import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { queryClientInstance } from '@/lib/query-client';

interface AuthState {
  user: AppUser | null; isAuthenticated: boolean; isLoadingAuth: boolean; isLoadingPublicSettings: boolean;
  authError: { type: string; message: string } | null; appPublicSettings: unknown; authChecked: boolean;
  logout: () => void; navigateToLogin: () => void; checkUserAuth: () => Promise<void>; checkAppState: () => Promise<void>;
}
export type AppUser = User & { data?: { subscription_tier?: string } };
const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState<AuthState["authError"]>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState<unknown>(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `${appParams.appBaseUrl}/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId!
        },
        token: appParams.token || undefined, // Include token if available
        interceptResponses: true
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        
        // If we got the app public settings successfully, check if user is authenticated
        // The SDK also restores tokens saved by email/password login.
        await checkUserAuth();
        setIsLoadingPublicSettings(false);
      } catch (caughtError) {
    const appError = asError(caughtError);
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            await checkUserAuth();
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (caughtError) {
    const error = asError(caughtError);
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setAuthError(null);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (caughtError) {
    const error = asError(caughtError);
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        // ProtectedRoute sends signed-out users to our local login page.
        setUser(null);
        setAuthError(null);
      } else {
        setAuthError({ type: 'unknown', message: error.message || 'Failed to check your session' });
      }
    }
  };

  const logout = () => {
    // SDK logout always navigates to the hosted Base44 domain. This frontend
    // uses local bearer tokens, so clear them and reload on our own origin.
    window.localStorage.removeItem('base44_access_token');
    window.localStorage.removeItem('token');
    appParams.token = null;
    queryClientInstance.clear();
    base44.cleanup();
    setUser(null);
    setIsAuthenticated(false);
    // Full navigation discards SDK authorization headers and pending auth state.
    window.location.replace(new URL('/login', window.location.origin).href);
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
