import React, { useEffect } from "react";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Flex, Form } from "antd";
import InputField from "@/components/ui/InputField";
import {
  LoginFieldNames,
  LoginFieldPlaceholders,
} from "@/features/auth/data/constants";
import { Roles, TextFieldType } from "@/data/types";
import { Typography } from "antd";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  useLoginMutation,
  useSuperAdminLoginMutation,
} from "../services/authApiServices";
import { useGlobalNotification } from "@/hooks/useNotification";
import { ROUTES } from "@/data/routes";
import { useDispatch, useSelector } from "react-redux";
import { resetStore } from "@/redux/store/actions";
import { setUserCredentials } from "@/redux/store/slices/authUserSlice";
import {
  setAdminCredentials,
  setServices,
} from "@/redux/store/slices/authAdminSlice";
import { LOGIN_MESSAGES } from "@/data/messages";
import { loadRoutes } from "@/utils/loadRoutes";
import { RootState } from "@/redux/store";
import getDefaultRouteForRole from "@/utils/helpers/getDefaultRouteForRole";

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const [loginUser, { isLoading: isUserLoading }] = useLoginMutation();
  const location = useLocation();
  const isAdmin = location.pathname.includes(ROUTES.ADMIN);
  const user = useSelector((state: RootState) =>
    isAdmin ? state.authAdmin.admin : state.authUser.user,
  );

  const [superAdmin, { isLoading: isAdminLoading }] =
    useSuperAdminLoginMutation();

  const isLoading = isUserLoading || isAdminLoading;
  const navigate = useNavigate();
  let defaultRoute = null;
  let changePasswordRoute = ROUTES.CHANGE_PASSWORD;

  const showNotification = useGlobalNotification();
  const dispatch = useDispatch();
  const onFinish = async (values: LoginFormValues) => {
    try {
      let response;

      // normalize email
      const payload = {
        ...values,
        email: values?.email?.trim().toLowerCase(),
      };

      if (location.pathname.includes(ROUTES.ADMIN_LOGIN)) {
        response = await superAdmin(payload).unwrap();
      } else {
        response = await loginUser(payload).unwrap();
      }

      dispatch(resetStore());

      if (
        response?.user.role.name === Roles.ADMIN ||
        response?.user.role.name === Roles.SUPER_ADMIN ||
        response?.user.role.name === Roles.FACILITY_INCHARGE ||
        response?.user.role.name === Roles.HEAD_OFFICE
      ) {
        dispatch(setAdminCredentials(response.user));
        dispatch(setServices(response.services));
        defaultRoute = ROUTES.ADMIN_DASHBOARD;
        changePasswordRoute = ROUTES.ADMIN_CHANGE_PASSWORD;
      } else {
        dispatch(setUserCredentials(response.user));
        defaultRoute = getDefaultRouteForRole(response?.user?.role?.name);
      }

      // Password was reset by a super admin: every other API call is blocked
      // until the user sets a new one, so skip loading routes for now.
      if (response?.user?.must_change_password) {
        showNotification(
          "warning",
          "Password change required",
          "Your password was reset by an administrator. Please set a new password to continue.",
        );
        navigate(changePasswordRoute, { replace: true });
        return;
      }

      loadRoutes();

      showNotification(
        LOGIN_MESSAGES.SUCCESS.type,
        LOGIN_MESSAGES.SUCCESS.title,
        LOGIN_MESSAGES.SUCCESS.description,
      );

      navigate(defaultRoute, { replace: true });
    } catch (error: any) {
      showNotification(
        LOGIN_MESSAGES.FAILURE.type,
        error?.data?.error?.data?.error || LOGIN_MESSAGES.FAILURE.title,
        error?.data?.error?.data?.message || LOGIN_MESSAGES.FAILURE.decription,
      );
    }
  };

  useEffect(() => {
    if (user) {
      const defaultRoute = isAdmin
        ? ROUTES.ADMIN_DASHBOARD
        : getDefaultRouteForRole(user?.role?.name);

      navigate(defaultRoute, { replace: true });
      return; // Prevent rendering the form if already logged in
    }
  }, [user]);

  return (
    <>
      <Typography.Title level={4} className="!text-green-custom text-center">
        Sign in to your account
      </Typography.Title>
      <Form
        name="login"
        initialValues={{ remember: true }}
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: 24,
          borderRadius: 8,
        }}
        onFinish={onFinish}
      >
        <InputField
          name={LoginFieldNames.email}
          placeholder={LoginFieldPlaceholders.Username}
          required
          prefix={<UserOutlined />}
        />
        <InputField
          name={LoginFieldNames.Password}
          placeholder={LoginFieldPlaceholders.Password}
          prefix={<LockOutlined />}
          type={TextFieldType.Password}
          required
        />
        <br />

        <Form.Item>
          <Button
            className="!bg-green-custom !border-green-custom !text-white"
            // style={{ backgroundColor: "#064526", borderColor: "#064526" }}
            block
            type="primary"
            htmlType="submit"
            loading={isLoading}
          >
            Log in
          </Button>
          <Flex justify="right" className="!mt-1">
            <Link
              style={{
                color: "var(--color-green-custom)",
                pointerEvents: isLoading ? "none" : "auto",
                opacity: isLoading ? 0.5 : 1,
              }}
              to={ROUTES.FORGOT_PASSWORD}
            >
              Forgot password?
            </Link>
          </Flex>
        </Form.Item>
      </Form>
    </>
  );
};

export default LoginForm;
