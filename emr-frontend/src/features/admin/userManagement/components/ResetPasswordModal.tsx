import React, { useState } from "react";
import { Alert, Button, Form, Input, Modal, Space, Typography } from "antd";
import { CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { useGlobalNotification } from "@/hooks/useNotification";
import {
  User,
  useResetUserPasswordMutation,
} from "@/features/admin/services/usersApiService";
import {
  generateTemporaryPassword,
  getApiErrorMessage,
  passwordPolicyRules,
} from "@/utils/helpers/passwordPolicy";

interface ResetPasswordModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

interface ResetPasswordFormValues {
  new_password: string;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  user,
  open,
  onClose,
  onCompleted,
}) => {
  const [form] = Form.useForm<ResetPasswordFormValues>();
  const showNotification = useGlobalNotification();
  const [resetUserPassword, { isLoading }] = useResetUserPasswordMutation();
  // Set once the reset succeeds, so the super admin can copy and share it.
  const [issuedPassword, setIssuedPassword] = useState<string | null>(null);

  const handleGenerate = () => {
    form.setFieldsValue({ new_password: generateTemporaryPassword() });
    form.validateFields(["new_password"]).catch(() => undefined);
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showNotification("success", "Password copied to clipboard");
    } catch {
      showNotification(
        "error",
        "Could not copy the password",
        "Please select and copy it manually.",
      );
    }
  };

  const handleSubmit = async ({ new_password }: ResetPasswordFormValues) => {
    if (typeof user?.id !== "number") return;

    try {
      await resetUserPassword({ id: user.id, new_password }).unwrap();
      setIssuedPassword(new_password);
    } catch (error) {
      showNotification(
        "error",
        "Failed to reset password",
        getApiErrorMessage(error),
      );
    }
  };

  const handleClose = () => {
    const wasReset = issuedPassword !== null;
    setIssuedPassword(null);
    onClose();
    if (wasReset) {
      onCompleted();
    }
  };

  const footer = issuedPassword
    ? [
        <Button key="done" type="primary" onClick={handleClose}>
          Done
        </Button>,
      ]
    : [
        <Button key="cancel" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          loading={isLoading}
          onClick={() => form.submit()}
        >
          Reset Password
        </Button>,
      ];

  return (
    <Modal
      title={`Reset Password - ${user?.name || ""}`}
      open={open}
      onCancel={handleClose}
      footer={footer}
      maskClosable={false}
      destroyOnHidden={true}
    >
      {issuedPassword ? (
        <Space direction="vertical" size="middle" className="w-full">
          <Alert
            type="success"
            showIcon
            message="Password has been reset"
            description={`${user?.name || "The user"} has been logged out and must set a new password at their next login.`}
          />
          <div>
            <Typography.Text strong>Temporary password</Typography.Text>
            <Space.Compact className="w-full !mt-1">
              <Input readOnly value={issuedPassword} className="font-mono" />
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleCopy(issuedPassword)}
              >
                Copy
              </Button>
            </Space.Compact>
          </div>
          <Alert
            type="warning"
            showIcon
            message="Share this password with the user by phone or in person. It will not be shown again."
          />
        </Space>
      ) : (
        <>
          <Alert
            className="!mb-4"
            type="info"
            showIcon
            message={`Set a temporary password for ${user?.email || "this user"}`}
            description="Use this for accounts that cannot receive the forgot password email, such as facility incharges. The user will be logged out and asked to choose a new password at their next login."
          />
          <Form
            form={form}
            layout="vertical"
            preserve={false}
            onFinish={handleSubmit}
          >
            <Form.Item label="Temporary Password" required>
              <Space.Compact className="w-full">
                <Form.Item
                  name="new_password"
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: "Please enter or generate a temporary password",
                    },
                    ...passwordPolicyRules,
                  ]}
                >
                  <Input
                    placeholder="Enter or generate a temporary password"
                    autoComplete="off"
                    className="font-mono"
                    disabled={isLoading}
                  />
                </Form.Item>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleGenerate}
                  disabled={isLoading}
                >
                  Generate
                </Button>
              </Space.Compact>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default ResetPasswordModal;
