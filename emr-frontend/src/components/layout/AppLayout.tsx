import React from "react";
import BaseLayout from "../shared/BaseLayout";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/index";
import { useSidebarConfig } from "@/hooks/useSidebarItems";
import { useLocation } from "react-router-dom";
import { ROUTES } from "@/data/routes";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.includes(ROUTES.ADMIN);
  const user = useSelector((state: RootState) =>
    isAdmin ? state.authAdmin.admin : state.authUser.user
  );

  const sideBarItems = useSidebarConfig(user || undefined);

  if (!user) return null;
  return (
    <BaseLayout userData={user} sideBarItems={sideBarItems}>
      {children}
    </BaseLayout>
  );
};

export default AppLayout;
