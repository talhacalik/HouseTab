import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessaging, requestPermission, getToken, AuthorizationStatus } from '@react-native-firebase/messaging';
import { logout as firebaseLogout } from '../services/authService';
import i18n from '../i18n';
import { getUserSettings, updateFcmToken } from '../services/userService';

async function registerFcmToken(): Promise<void> {
  try {
    const m = getMessaging();
    const authStatus = await requestPermission(m);
    const granted =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    if (!granted) return;
    const token = await getToken(m);
    if (token) await updateFcmToken(token);
  } catch {
    // Push bildirim kaydı başarısız — sessizce geç
  }
}

const TOKEN_KEY = 'auth_token';

export interface User {
  id: number;
  email: string;
  fullName: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setToken(parsed.token);
          setUser(parsed.user);
          try {
            const settings = await getUserSettings();
            const lang = settings.language === 'EN' ? 'en' : 'tr';
            await i18n.changeLanguage(lang);
            await AsyncStorage.setItem('app_language', lang);
          } catch {
            // Sessizce geç
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (user: User, token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify({ token, user }));
    setToken(token);
    setUser(user);
    try {
      const settings = await getUserSettings();
      const lang = settings.language === 'EN' ? 'en' : 'tr';
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem('app_language', lang);
    } catch {
      // Ayar yüklenemezse varsayılan dil (tr) korunur, sessizce geç
    }
    registerFcmToken();
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await firebaseLogout();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((user: User) => {
    setUser(user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
