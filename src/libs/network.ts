import axios from 'axios';

const network = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Mengirimkan dan menerima HttpOnly session cookie secara otomatis
});

network.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Bersihkan penyimpanan browser warisan (cutover)
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');

      const reqUrl = error.config?.url || '';
      const isAuthEndpoint = reqUrl.includes('/auth/');

      // Hanya arahkan ke /auth/login jika permintaan bukan endpoint auth
      // dan pengguna sedang berada di area terlindungi (dashboard/booking)
      const currentPath = window.location.pathname;
      const isProtectedArea =
        currentPath.startsWith('/dashboard') ||
        currentPath.startsWith('/admin') ||
        currentPath.startsWith('/reviewer') ||
        currentPath.startsWith('/booking-history') ||
        currentPath.startsWith('/payment');

      if (!isAuthEndpoint && isProtectedArea) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);

export default network;
