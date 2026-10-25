import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, type JSX } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import protectedLoader, {
  reviewerLoader,
  expertLoader,
  adminLoader,
} from './pages/Auth/loader/Protected.loader';
import publicLoader from './pages/Auth/loader/Public.loader';
import verifyLoader from './pages/Auth/loader/Verify.loader';
import expertChatPageLoader from './pages/Chat/ExpertChatPage.loader';
import { WorkspaceProvider } from './context/WorkspaceContext';
import LandingPage from './pages/Home/LandingPage';
import RouteErrorPage from './components/errors/RouteErrorPage';

const Login = lazy(() => import('./pages/Auth/Login'));
const Signup = lazy(() => import('./pages/Auth/Signup'));
const Verify = lazy(() => import('./pages/Auth/Verify'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const ExpertChatPage = lazy(() => import('./pages/Chat/ExpertChatPage'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Transaction = lazy(() => import('./pages/Dashboard/Transaction'));
const BrowseExperts = lazy(() => import('./pages/Experts/BrowseExperts'));
const DetailExperts = lazy(() => import('./pages/Experts/DetailExperts'));
const ApplyExpertPage = lazy(() => import('./pages/Experts/ApplyExpertPage'));
const CandidateApplicationPage = lazy(
  () => import('./pages/Dashboard/Candidate/CandidateApplicationPage'),
);
const ReviewQueue = lazy(() => import('./pages/Dashboard/ReviewQueue'));
const KnowledgeReviewQueue = lazy(
  () => import('./pages/Dashboard/Reviewer/KnowledgeReviewQueue'),
);
const KnowledgeReviewDetail = lazy(
  () => import('./pages/Dashboard/Reviewer/KnowledgeReviewDetail'),
);
const AdminOverview = lazy(() => import('./pages/Dashboard/Admin/AdminOverview'));
const AdminExpertApplications = lazy(
  () => import('./pages/Dashboard/Admin/AdminExpertApplications'),
);
const AdminExperts = lazy(() => import('./pages/Dashboard/Admin/AdminExperts'));
const AdminReviewers = lazy(() => import('./pages/Dashboard/Admin/AdminReviewers'));
const AdminAudit = lazy(() => import('./pages/Dashboard/Admin/AdminAudit'));
const AdminKnowledge = lazy(() => import('./pages/Dashboard/Admin/AdminKnowledge'));
const AdminPersonas = lazy(() => import('./pages/Dashboard/Admin/AdminPersonas'));
const About = lazy(() => import('./pages/Home/About'));
const PaymentSuccess = lazy(() => import('./pages/Payment/PaymentSuccess'));

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
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/signup',
    element: <Navigate to="/auth/signup" replace />,
  },
  {
    path: '/login',
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: '/booking-history',
    loader: protectedLoader,
    element: <Navigate to="/dashboard/konsultasi" replace />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/auth',
    loader: publicLoader,
    errorElement: <RouteErrorPage />,
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
      {
        path: '/auth/forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: '/auth/reset-password',
        element: <ResetPassword />,
      },
    ],
  },

  {
    path: '/payment',
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: '/payment/success',
        loader: protectedLoader,
        element: <PaymentSuccess />,
      },
    ],
  },

  {
    path: '/about',
    element: <About />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/expert/apply',
    loader: protectedLoader,
    element: <ApplyExpertPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/experts',
    errorElement: <RouteErrorPage />,
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
        loader: async (args) => {
          const authResult = await protectedLoader();
          return authResult ?? (await expertChatPageLoader(args));
        },
        element: <ExpertChatPage />,
      },
    ],
  },
  {
    path: '/dashboard',
    loader: protectedLoader,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/dashboard/konsultasi',
        element: <Dashboard />,
      },
      {
        path: '/dashboard/pembayaran',
        element: <Dashboard />,
      },
      {
        path: '/dashboard/koleksi',
        element: <Dashboard />,
      },
      {
        path: '/dashboard/notifikasi',
        element: <Dashboard />,
      },
      {
        path: '/dashboard/profil',
        element: <Dashboard />,
      },
      {
        path: '/dashboard/application',
        element: <CandidateApplicationPage />,
      },
      {
        path: '/dashboard/application/activation',
        element: <CandidateApplicationPage />,
      },
      {
        path: '/dashboard/pakar',
        loader: expertLoader,
        element: <Dashboard />,
      },
      {
        path: '/dashboard/pakar/permintaan',
        loader: expertLoader,
        element: <Dashboard />,
      },
      {
        path: '/dashboard/pakar/kalender',
        loader: expertLoader,
        element: <Dashboard />,
      },
      {
        path: '/dashboard/pakar/layanan',
        loader: expertLoader,
        element: <Dashboard />,
      },
      {
        path: '/dashboard/pakar/profil',
        loader: expertLoader,
        element: <Dashboard />,
      },
      {
        path: '/dashboard/pakar/keuangan',
        loader: expertLoader,
        element: <Dashboard />,
      },
      {
        path: '/dashboard/pakar/ulasan',
        loader: expertLoader,
        element: <Dashboard />,
      },
      {
        path: '/dashboard/pakar/materi',
        loader: expertLoader,
        element: <Dashboard />,
      },
      {
        path: '/dashboard/pakar/analitik',
        loader: expertLoader,
        element: <Dashboard />,
      },
      {
        path: '/dashboard/pakar/keselamatan',
        loader: expertLoader,
        element: <Dashboard />,
      },
      {
        path: '/dashboard/transaction',
        element: <Transaction />,
      },
      {
        path: '/dashboard/reviews',
        loader: reviewerLoader,
        element: <ReviewQueue />,
      },
    ],
  },
  {
    path: '/reviewer',
    loader: reviewerLoader,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: '/reviewer/applications',
        element: <ReviewQueue />,
      },
      {
        path: '/reviewer/applications/:applicationId',
        element: <ReviewQueue />,
      },
      {
        path: '/reviewer/knowledge',
        element: <KnowledgeReviewQueue />,
      },
      {
        path: '/reviewer/knowledge/:versionId',
        element: <KnowledgeReviewDetail />,
      },
    ],
  },
  {
    path: '/admin',
    loader: adminLoader,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: '/admin',
        element: <AdminOverview />,
      },
      {
        path: '/admin/applications',
        element: <AdminExpertApplications />,
      },
      {
        path: '/admin/experts',
        element: <AdminExperts />,
      },
      {
        path: '/admin/reviewers',
        element: <AdminReviewers />,
      },
      {
        path: '/admin/knowledge',
        element: <AdminKnowledge />,
      },
      {
        path: '/admin/personas',
        element: <AdminPersonas />,
      },
      {
        path: '/admin/audit',
        element: <AdminAudit />,
      },
    ],
  },
  {
    path: '*',
    element: <RouteErrorPage notFound />,
  },
]);

const App = (): JSX.Element => {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <Suspense
          fallback={
            <div className="flex min-h-[100dvh] items-center justify-center bg-white text-sm text-gray-600">
              Memuat KataNusa…
            </div>
          }
        >
          <RouterProvider router={router} />
        </Suspense>
      </WorkspaceProvider>
    </QueryClientProvider>
  );
};

export default App;
