import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';
import { AuthGuard } from '../utils/authGuard';
import HomePage from '../pages/Home';
import ExplorePage from '../pages/Explore';
import DetailPage from '../pages/Detail';
import CreatePage from '../pages/Create';
import EditPage from '../pages/Edit';
import LoginPage from '../pages/Auth/Login';
import RegisterPage from '../pages/Auth/Register';
import CallbackPage from '../pages/Auth/Callback';
import UserPage from '../pages/User';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        element: <AuthGuard requireAuth={false} />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      { path: 'callback', element: <CallbackPage /> },
    ],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'component/:id', element: <DetailPage /> },
      {
        element: <AuthGuard />,
        children: [
          { path: 'create', element: <CreatePage /> },
          { path: 'edit/:id', element: <EditPage /> },
        ],
      },
      { path: 'user/:id', element: <UserPage /> },
    ],
  },
]);
