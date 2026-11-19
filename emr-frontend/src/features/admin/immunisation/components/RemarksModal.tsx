import React, { useEffect } from "react";
import { Modal, Form, Input, Button } from "antd";
import { useGlobalNotification } from "@/hooks/useNotification";
import { useClosePatientImmunisationMutation } from "../../services/immunisationAdmin";
import Loader from "@/components/shared/Loader";

interface RemarksModalProps {
  open: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  remarks?: string | null;
  onCaseClosed?: () => void;
}

const RemarksModal: React.FC<RemarksModalProps> = ({
  open,
  onClose,
  patientId,
  patientName,
  remarks,
  onCaseClosed,
}) => {
  const [form] = Form.useForm();
  const showNotification = useGlobalNotification();

  const isViewMode = typeof remarks === "string" && remarks.trim().length > 0;

  const [markClosed, { isLoading: isClosing }] =
    useClosePatientImmunisationMutation();

  useEffect(() => {
    if (isViewMode) form.setFieldsValue({ remarks });
    else form.resetFields();
  }, [isViewMode, remarks, form]);

  const handleMarkClosed = async () => {
    try {
      await markClosed({ patientId }).unwrap();

      showNotification(
        "success",
        "Case Closed",
        "Patient immunisation status marked as closed successfully",
      );

      onCaseClosed?.();

      form.resetFields();
      onClose();
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to mark case closed";
      showNotification("error", "Error", message);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  if (isClosing) {
    return <Loader />;
  }

  return (
    <Modal
      title={`Remarks - ${patientName}`}
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="closeCase"
          type="primary"
          loading={isClosing}
          onClick={handleMarkClosed}
          disabled={!isViewMode}
        >
          Mark Closed
        </Button>,
      ]}
      width={500}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="remarks" label="Remarks">
          <Input.TextArea rows={4} disabled maxLength={500} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RemarksModal;
