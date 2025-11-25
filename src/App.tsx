import type { JSX } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ExpertChatPage from './pages/Chat/ExpertChatPage';
import expertChatPageLoader from './pages/Chat/ExpertChatPage.loader.ts';
import BrowseExperts from './pages/Experts/BrowseExperts';
import DetailExperts from './pages/Experts/DetailExperts.tsx';
import LandingPage from './pages/Home/LandingPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
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
]);

const App = (): JSX.Element => {
  return <RouterProvider router={router} />;
};

export default App;
