import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { JSX } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Verify from './pages/Auth/Verify';
import protectedLoader from './pages/Auth/loader/Protected.loader';
import publicLoader from './pages/Auth/loader/Public.loader';
import verifyLoader from './pages/Auth/loader/Verify.loader';
import BookingHistory from './pages/Booking/BookingHistory';
import ExpertChatPage from './pages/Chat/ExpertChatPage';
import expertChatPageLoader from './pages/Chat/ExpertChatPage.loader';
import Dashboard from './pages/Dashboard/Dashboard';
import Transaction from './pages/Dashboard/Transaction';
import BrowseExperts from './pages/Experts/BrowseExperts';
import DetailExperts from './pages/Experts/DetailExperts';
import About from './pages/Home/About';
import LandingPage from './pages/Home/LandingPage';
import PaymentSuccess from './pages/Payment/PaymentSuccess';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/booking-history',
    element: <BookingHistory />,
  },
  {
    path: '/auth',
    loader: publicLoader,
    children: [
      {
        path: '/auth/login',
        element: <Login />,
      },
      {
        path: '/auth/signup',
        element: <Signup />,
      },
      {
        path: '/auth/verify',
        loader: verifyLoader,
        element: <Verify />,
      },
    ],
  },

  {
    path: '/payment',
    children: [
      {
        path: '/payment/success',
        element: <PaymentSuccess />,
      },
    ],
  },

  {
    path: '/about',
    element: <About />,
  },
  {
    path: '/experts',
    children: [
      {
        path: '/experts',
        element: <BrowseExperts />,
      },
      {
        path: '/experts/:id',
        loader: expertChatPageLoader,
        element: <DetailExperts />,
      },
      {
        path: '/experts/:id/chats',
        loader: expertChatPageLoader,
        element: <ExpertChatPage />,
      },
    ],
  },
  {
    path: '/dashboard',
    loader: protectedLoader,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/dashboard/transaction',
        element: <Transaction />,
      },
    ],
  },
]);

const App = (): JSX.Element => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;
