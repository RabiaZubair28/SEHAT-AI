import React, { useState } from "react";
import { Form } from "antd";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import {
  ForgetPasswordField,
  ForgetPasswordFieldLabel,
  ForgetPasswordFieldPlaceholder,
} from "@/features/auth/data/constants";
import Title from "@/components/shared/Title";
import { useSendEmailMutation } from "../services/authApiServices";
import { useGlobalNotification } from "@/hooks/useNotification";

const ForgotPasswordForm: React.FC = () => {
  const [sendEmail] = useSendEmailMutation();
  const [form] = Form.useForm();
  const [emailSent, setEmailSent] = useState(false);
  const notification = useGlobalNotification();

  const onFinish = async () => {
    const payload = {
      email: form.getFieldValue(ForgetPasswordField.Email),
    };
    try {
      const response = await sendEmail(payload).unwrap();
      if (response?.success) {
        notification("success", "Reset link sent to your email");
        setEmailSent(true);
      }
    } catch (error: any) {
      let error_msg = error?.data?.error?.data?.message
      notification("error", error_msg || "Failed to send reset link");
    }
  };

  return (
    <div>
      <div className="text-center">
        <Title level={4} text="Forget Password" className="" />
      </div>
      {!emailSent ? (
        <Form
          form={form}
          onFinish={onFinish}
          name="forgot-password"
          layout="vertical"
        >
          <InputField
            name={ForgetPasswordField.Email}
            label={ForgetPasswordFieldLabel.Email}
            placeholder={ForgetPasswordFieldPlaceholder.Email}
            required
          />
          <Form.Item>
            <Button
              title={"Send Reset Link"}
              fullWidth={true}
              size={"sm"}
              type="submit"
              rounded="sm"
            />
          </Form.Item>
        </Form>
      ) : (
        <div className="text-center">
          <p className="text-gray-600">
            A password reset link has been sent to your email.
          </p>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
