// src/hocs/withPrivateRoute.tsx
import React, { Suspense } from "react";
import Loader from "@/components/shared/Loader";
import { PrivateRoute } from "@/features/auth/components/PrivateRoute";
import { UserRole } from "@/data/types";

export const withPrivateRoute = <P extends object>(
  Component: React.ComponentType<P>,
  roles?: UserRole[]
) => {
  return (props: P) => (
    <PrivateRoute roles={roles}>
      <Suspense fallback={<Loader />}>
        <Component {...props} />
      </Suspense>
    </PrivateRoute>
  );
};
