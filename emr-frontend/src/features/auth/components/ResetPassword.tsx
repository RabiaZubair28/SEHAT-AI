import React from "react";
import { Form } from "antd";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import {
  ResetPasswordField,
  ResetPasswordFieldLabel,
  ResetPasswordFieldPlaceholder,
} from "@/features/auth/data/constants";
import Title from "@/components/shared/Title";
import { TextFieldType } from "@/data/types";
import { useResetPasswordWithTokenMutation } from "../services/authApiServices";
import { useGlobalNotification } from "@/hooks/useNotification";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/data/routes";

const ResetPasswordForm: React.FC = () => {
  const [resetPasswordWithToken] = useResetPasswordWithTokenMutation();
  const [form] = Form.useForm();
  const notification = useGlobalNotification();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  console.log("Reset token:", token);

  const onFinish = async (values: Record<string, string>) => {
    const password = values[ResetPasswordField.Password];
    const confirmPassword = values[ResetPasswordField.ConfirmPassword];

    if (password !== confirmPassword) {
      notification("error", "Passwords do not match");
      return;
    }

    if (!token) {
      notification("error", "Invalid or missing reset token");
      return;
    }

    try {
      const response = await resetPasswordWithToken({
        token,
        password,
      }).unwrap();

      if (response?.success) {
        notification("success", "Password reset successfully");
        navigate(ROUTES.LOGIN);
      }
    } catch (error: any) {
      notification("error", "Failed to reset password");
    }
  };

  return (
    <div>
      <Title level={4} text="Reset Password" />
      <Form
        form={form}
        name="reset-password"
        onFinish={onFinish}
        layout="vertical"
      >
        <InputField
          name={ResetPasswordField.Password}
          label={ResetPasswordFieldLabel.Password}
          placeholder={ResetPasswordFieldPlaceholder.Password}
          type={TextFieldType.Password}
          required
        />
        <InputField
          name={ResetPasswordField.ConfirmPassword}
          label={ResetPasswordFieldLabel.ConfirmPassword}
          placeholder={ResetPasswordFieldPlaceholder.ConfirmPassword}
          type={TextFieldType.Password}
          required
        />
        <Form.Item>
          <Button
            title={"Reset Password"}
            fullWidth={true}
            size={"sm"}
            type="submit"
            rounded="sm"
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default ResetPasswordForm;
