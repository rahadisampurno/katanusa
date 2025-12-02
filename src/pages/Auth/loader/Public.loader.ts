import auth from '../../../libs/auth';

const publicLoader = (): void | null => {
  const isAuthenticated = auth.isAuthenticated();
  if (isAuthenticated) {
    window.location.href = '/';
    return;
  }
  return null;
};

export default publicLoader;
