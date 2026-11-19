import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/data/routes";
import { useLogout } from "./useLogout";

export const useUserDropdownItems = () => {
  const { handleLogout, isLogoutLoading } = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.includes(ROUTES.ADMIN);

  const dropdownItems = [
    {
      key: "change-password",
      label: "Change Password",
      onClick: () =>
        navigate(
          isAdmin ? ROUTES.ADMIN_CHANGE_PASSWORD : ROUTES.CHANGE_PASSWORD,
        ),
    },
    { key: "1", label: "Logout", onClick: handleLogout },
  ];

  return { dropdownItems, isLogoutLoading };
};
