import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSession, signIn as authSignIn, signOut as authSignOut } from '../api/services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const data = await getSession();
      setSession(data?.user ? data : null);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const signIn = useCallback(async (email, password) => {
    await authSignIn(email, password);
    await refetch();
  }, [refetch]);

  const signOut = useCallback(async () => {
    await authSignOut();
    setSession(null);
  }, []);

  const value = {
    session,
    loading,
    isAuthenticated: !!session?.user,
    user: session?.user ?? null,
    signIn,
    signOut,
    refetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
