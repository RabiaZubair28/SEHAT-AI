import { RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import { publicRoutes } from "./public";
import { protectedRoutes } from "./protected";
import { adminRoutes } from "./admin";
import Loader from "@/components/shared/Loader";
import RouteErrorBoundary from "@/components/shared/RouteErrorBoundary";
import { ROUTES } from "@/data/routes";
const NotFoundPage = lazy(() => import("@/pages/NotFound"));
const ForbiddenPage = lazy(() => import("@/pages/ForbiddenPage"));

const lazyLoad = (Component: React.LazyExoticComponent<React.FC>) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      ...publicRoutes,
      ...protectedRoutes,
      ...adminRoutes,

      {
        path: ROUTES.FORBIDDEN,
        element: lazyLoad(ForbiddenPage),
      },

      {
        path: "*",
        element: lazyLoad(NotFoundPage),
      },
    ],
  },
];
