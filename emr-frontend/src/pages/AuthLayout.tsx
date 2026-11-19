import { Outlet } from "react-router-dom";
import AuthLayout from "@/components/layout/AuthLayout";

const AuthLayoutPage = () => {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
};

export default AuthLayoutPage;
