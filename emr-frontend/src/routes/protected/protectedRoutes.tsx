import React from "react";
import { RouteObject } from "react-router-dom";
import { withPrivateRoute } from "@/hocs/withprivateRoute";
import { Roles } from "@/data/types";
import { userRoutes } from "@/config/userRoutesConfig";

// Define the structure of your user routes
interface UserRoute {
  path: string;
  element: React.ComponentType<any>;
  roles: Roles[];
  children?: UserRouteChild[];
}

interface UserRouteChild {
  path?: string;
  element: React.ComponentType<any>;
  roles: Roles[];
  index?: boolean;
}

const protectedRoute = (
  Component: React.ComponentType<any>,
  roles: Roles[]
): React.ReactElement => {
  const Wrapped = withPrivateRoute(Component, roles);
  return <Wrapped />;
};

// Generating protected routes dynamically
export const protectedRoutes: RouteObject[] = userRoutes.map(
  ({ path, element, roles, children }: UserRoute): RouteObject => ({
    path,
    element: protectedRoute(element, roles),
    children: children?.map((child: UserRouteChild): RouteObject => {
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
