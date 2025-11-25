import type { UserDataType } from '../types/auth';

const setAccessToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const removeAccessToken = (): void => {
  localStorage.removeItem('access_token');
};

const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  return !!token;
};

const logout = (): void => {
  removeAccessToken();
};

const setUserData = (userData: UserDataType): void => {
  localStorage.setItem('user_data', JSON.stringify(userData));
};

const getUserData = (): UserDataType | null => {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

export default {
  setAccessToken,
  getAccessToken,
  removeAccessToken,
  isAuthenticated,
  logout,
  setUserData,
  getUserData,
};
