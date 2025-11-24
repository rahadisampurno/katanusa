import type { JSX } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import ExpertChatPage from './pages/Chat/ExpertChatPage';
import expertChatPageLoader from './pages/Chat/ExpertChatPage.loader.ts';
import BrowseExperts from './pages/Experts/BrowseExperts';
import LandingPage from './pages/Home/LandingPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/experts',
    children: [
      {
        path: '/experts',
        element: <BrowseExperts />,
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
