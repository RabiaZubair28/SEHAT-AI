// src/components/ui/ConfirmModal.tsx
import React from "react";
import { Modal } from "antd";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  okText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = "Are you sure?",
  message,
  onConfirm,
  onCancel,
  okText = "Yes",
  cancelText = "No",
}) => {
  return (
    <Modal
      open={open}
      title={title}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
    >
      <p>{message}</p>
    </Modal>
  );
};

export default ConfirmModal;
