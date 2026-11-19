import { RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loader from "@/components/shared/Loader";
import { ROUTES } from "@/data/routes";

const lazyLoad = (Component: React.LazyExoticComponent<React.FC>) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);

const AuthLayoutPage = lazy(() => import("@/pages/AuthLayout"));
const Login = lazy(() => import("@/pages/login"));
const ForgetPassword = lazy(() => import("@/pages/ForgetPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const ChangePassword = lazy(() => import("@/pages/ChangePassword"));
const RootEntry = lazy(() => import("@/routes/RootEntry"));
const Impersonate = lazy(() => import("@/pages/Impersonate"));

export const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: lazyLoad(RootEntry),
  },
  {
    element: lazyLoad(AuthLayoutPage),
    children: [
      { path: ROUTES.LOGIN, element: lazyLoad(Login) },
      { path: ROUTES.FORGOT_PASSWORD, element: lazyLoad(ForgetPassword) },
      { path: ROUTES.RESET_PASSWORD, element: lazyLoad(ResetPassword) },
      { path: ROUTES.ADMIN_LOGIN, element: lazyLoad(Login) },
      // Rendered outside the app layout so a pending password change does not
      // trigger dashboard/sidebar API calls. The form itself requires a session.
      { path: ROUTES.CHANGE_PASSWORD, element: lazyLoad(ChangePassword) },
      { path: ROUTES.ADMIN_CHANGE_PASSWORD, element: lazyLoad(ChangePassword) },
    ],
  },
  { path: ROUTES.IMPERSONATE, element: lazyLoad(Impersonate) },
];
