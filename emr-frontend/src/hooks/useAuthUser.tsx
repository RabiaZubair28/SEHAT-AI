import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootState } from "@/redux/store";
import { ROUTES } from "@/data/routes";

export const useAuthUser = () => {
  const location = useLocation();
  const isAdmin = location.pathname.includes(ROUTES.ADMIN);

  const user = useSelector((state: RootState) =>
    isAdmin ? state.authAdmin.admin : state.authUser.user
  );

  return { user };
};
