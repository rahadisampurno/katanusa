import auth from '../../../libs/auth';

const protectedLoader = (): void | null => {
  const isAuthenticated = auth.isAuthenticated();
  if (!isAuthenticated) {
    window.location.href = '/auth/login';
    return;
  }
  return null;
};

export default protectedLoader;
