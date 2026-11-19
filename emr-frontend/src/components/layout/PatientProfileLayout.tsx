import React from "react";
import BaseLayout from "../shared/BaseLayout";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/index";
import { useSidebarConfig } from "@/hooks/useSidebarItems";
import { useInitPatientFromRoute } from "@/hooks/useInitPatientFromRoute";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

const PatientProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  const user = useSelector((state: RootState) => state.authUser?.user);
  const sideBarItems = useSidebarConfig(user || undefined);
  useInitPatientFromRoute();
  return (
    <BaseLayout userData={user} sideBarItems={sideBarItems}>
      {children}
    </BaseLayout>
  );
};

export default PatientProfileLayout;
