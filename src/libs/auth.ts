import network from './network';
import type { Capability, SessionResponse, UserDataType } from '../types/auth';

let currentSession: SessionResponse | null = null;

const notifyAuthChanged = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:session-changed'));
  }
};

const clearLegacyStorage = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user_data');
};

const getCachedUser = (): UserDataType | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('auth_user_cache');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const isAuthenticated = (): boolean => {
  return Boolean(currentSession?.user || getCachedUser());
};

const logout = async (): Promise<void> => {
  try {
    await network.post('/auth/logout');
  } catch {
    // Abaikan jika network error saat logout
  }
  clearLegacyStorage();
  localStorage.removeItem('active_workspace');
  localStorage.removeItem('auth_user_cache');
  currentSession = null;
  notifyAuthChanged();
};

const setUserData = (userData: UserDataType): void => {
  if (currentSession) {
    currentSession.user = userData;
  } else {
    currentSession = { user: userData };
  }
  try {
    localStorage.setItem('auth_user_cache', JSON.stringify(userData));
  } catch {
    // Abaikan jika storage penuh
  }
  notifyAuthChanged();
};

const getUserData = (): UserDataType | null => {
  if (currentSession?.user) return currentSession.user;
  return getCachedUser();
};

const getCapabilities = (): Capability[] => {
  return currentSession?.user?.capabilities ?? getUserData()?.capabilities ?? ['user'];
};

const hasCapability = (cap: Capability): boolean => {
  return getCapabilities().includes(cap);
};

const fetchSession = async (): Promise<SessionResponse | null> => {
  try {
    const res = await network.get<SessionResponse>('/auth/me');
    currentSession = res.data;
    if (res.data?.user) {
      try {
        localStorage.setItem('auth_user_cache', JSON.stringify(res.data.user));
      } catch {
        // ignore
      }
    }
    clearLegacyStorage();
    notifyAuthChanged();
    return res.data;
  } catch {
    currentSession = null;
    localStorage.removeItem('auth_user_cache');
    notifyAuthChanged();
    return null;
  }
};

export default {
  clearLegacyStorage,
  isAuthenticated,
  logout,
  setUserData,
  getUserData,
  getCapabilities,
  hasCapability,
  fetchSession,
};
