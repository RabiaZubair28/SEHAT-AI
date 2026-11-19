import React from "react";
import { Alert, Button, Form } from "antd";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import InputField from "@/components/ui/InputField";
import Title from "@/components/shared/Title";
import { TextFieldType } from "@/data/types";
import { ROUTES } from "@/data/routes";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useGlobalNotification } from "@/hooks/useNotification";
import { setAdminMustChangePassword } from "@/redux/store/slices/authAdminSlice";
import { setUserMustChangePassword } from "@/redux/store/slices/authUserSlice";
import { loadRoutes } from "@/utils/loadRoutes";
import getDefaultRouteForRole from "@/utils/helpers/getDefaultRouteForRole";
import {
  getApiErrorMessage,
  passwordPolicyRules,
} from "@/utils/helpers/passwordPolicy";
import { useChangePasswordMutation } from "../services/passwordApiService";
import {
  ChangePasswordField,
  ChangePasswordFieldLabel,
  ChangePasswordFieldPlaceholder,
} from "../data/constants";

const ChangePasswordForm: React.FC = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const showNotification = useGlobalNotification();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const isAdmin = location.pathname.includes(ROUTES.ADMIN);
  const { user: currentUser } = useAuthUser();
  // Set when a super admin reset the password; the user cannot leave this page.
  const isForced = !!currentUser?.must_change_password;
  const homeRoute = isAdmin
    ? ROUTES.ADMIN_DASHBOARD
    : getDefaultRouteForRole(currentUser?.role?.name);

  if (!currentUser) {
    return (
      <Navigate to={isAdmin ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN} replace />
    );
  }

  const onFinish = async (values: Record<string, string>) => {
    try {
      await changePassword({
        current_password: isForced
          ? undefined
          : values[ChangePasswordField.CurrentPassword],
        new_password: values[ChangePasswordField.NewPassword],
      }).unwrap();

      dispatch(
        isAdmin
          ? setAdminMustChangePassword(false)
          : setUserMustChangePassword(false),
      );

      if (isForced) {
        // Routes are not loaded at login while a password change is pending.
        await loadRoutes().catch(() => undefined);
      }

      showNotification("success", "Password changed successfully");
      navigate(homeRoute, { replace: true });
    } catch (error) {
      showNotification(
        "error",
        "Failed to change password",
        getApiErrorMessage(error),
      );
    }
  };

  return (
    <div>
      <Title
        level={4}
        text="Change Password"
        className="!text-green-custom text-center"
      />
      {isForced && (
        <Alert
          className="!mb-4"
          type="warning"
          showIcon
          message="Password change required"
          description="Your password was reset by an administrator. Please set a new password to continue."
        />
      )}
      <Form
        form={form}
        name="change-password"
        layout="vertical"
        onFinish={onFinish}
      >
        {/* A forced change follows a login with the temporary password, so it is not asked for again. */}
        {!isForced && (
          <InputField
            name={ChangePasswordField.CurrentPassword}
            label={ChangePasswordFieldLabel.CurrentPassword}
            placeholder={ChangePasswordFieldPlaceholder.CurrentPassword}
            type={TextFieldType.Password}
            required
          />
        )}
        <InputField
          name={ChangePasswordField.NewPassword}
          label={ChangePasswordFieldLabel.NewPassword}
          placeholder={ChangePasswordFieldPlaceholder.NewPassword}
          type={TextFieldType.Password}
          required
          rules={passwordPolicyRules}
        />
        <InputField
          name={ChangePasswordField.ConfirmPassword}
          label={ChangePasswordFieldLabel.ConfirmPassword}
          placeholder={ChangePasswordFieldPlaceholder.ConfirmPassword}
          type={TextFieldType.Password}
          required
          dependencies={[ChangePasswordField.NewPassword]}
          rules={[
            ({ getFieldValue }: { getFieldValue: (name: string) => string }) => ({
              validator(_: unknown, value: string) {
                if (
                  !value ||
                  getFieldValue(ChangePasswordField.NewPassword) === value
                ) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
        />
        <Form.Item className="!mb-2">
          <Button
            className="!bg-green-custom !border-green-custom !text-white"
            block
            type="primary"
            htmlType="submit"
            loading={isLoading}
          >
            Change Password
          </Button>
        </Form.Item>
        {!isForced && (
          <Button
            type="link"
            block
            style={{ color: "var(--color-green-custom)" }}
            onClick={() => navigate(homeRoute)}
          >
            Back
          </Button>
        )}
      </Form>
    </div>
  );
};

export default ChangePasswordForm;
