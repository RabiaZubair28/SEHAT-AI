import React, { useEffect } from "react";
import { Modal, Form, Input, Button } from "antd";
import { useAddPatientImmunisationRemarksMutation } from "../services/queueApi";
import { useGlobalNotification } from "@/hooks/useNotification";

interface RemarksModalProps {
  open: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  remarks?: string | null;
}

const RemarksModal: React.FC<RemarksModalProps> = ({
  open,
  onClose,
  patientId,
  patientName,
  remarks,
}) => {
  const [form] = Form.useForm();
  const showNotification = useGlobalNotification();
  const isViewMode = typeof remarks === "string" && remarks.trim().length > 0;
  const [addRemarks, { isLoading }] =
    useAddPatientImmunisationRemarksMutation();

  useEffect(() => {
    if (isViewMode) {
      form.setFieldsValue({ remarks });
    }
  }, [isViewMode, remarks, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      await addRemarks({
        patientId: patientId,
        remarks: values.remarks,
      }).unwrap();

      showNotification(
        "success",
        "Remarks Added",
        "Patient immunisation remarks added successfully"
      );

      form.resetFields();
      onClose();
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to add remarks";
      showNotification("error", "Error", message);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={isViewMode ? "View Remarks" : `Add Remarks - ${patientName}`}
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="close" onClick={handleCancel}>
          Close
        </Button>,
        !isViewMode && (
          <Button
            key="submit"
            type="primary"
            loading={isLoading}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        ),
      ]}
      width={500}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="remarks"
          label="Remarks"
          rules={[
            { required: true, message: "Please enter remarks" },
            { max: 500, message: "Remarks cannot exceed 500 characters" },
          ]}
        >
          <Input.TextArea
            rows={4}
            disabled={isViewMode} // 👈 disable editing
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RemarksModal;
