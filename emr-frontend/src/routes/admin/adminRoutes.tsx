import React from "react";
import { RouteObject } from "react-router-dom";
import { withPrivateRoute } from "@/hocs/withprivateRoute";
import { Roles } from "@/data/types";
import { adminRouteConfig } from "@/config/adminRoutesConfig";

// Define the structure matching your config
interface AdminRoute {
  path?: string;
  element: React.ComponentType<any>;
  roles: Roles[];
  index?: boolean;
}

interface AdminRouteConfig {
  path: string;
  element: React.ComponentType<any>;
  roles: Roles[];
  children?: AdminRoute[];
}

const protectedRoute = (
  Component: React.ComponentType<any>,
  roles: Roles[]
): React.ReactElement => {
  return withPrivateRoute(Component, roles)({});
};

// Generating protected admin routes dynamically
export const adminRoutes: RouteObject[] = adminRouteConfig.map(
  ({ path, element, roles, children }: AdminRouteConfig): RouteObject => ({
    path,
    element: protectedRoute(element, roles),
    children: children?.map((child: AdminRoute): RouteObject => {
      const {
        path: childPath,
        element: childElement,
        roles: childRoles,
        index,
      } = child;

      // Create route object based on whether it's an index route or not
      const childRoute: RouteObject = index
        ? {
            index: true,
            element: protectedRoute(childElement, childRoles),
          }
        : {
            path: childPath,
            element: protectedRoute(childElement, childRoles),
          };

      return childRoute;
    }),
  })
);
