import React from "react";
import { Modal, Button } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

interface WarningModalProps {
  visible: boolean;
  message: string[];
  onClose: () => void;
}

const WarningModal: React.FC<WarningModalProps> = ({
  visible,
  message,
  onClose,
}) => (
  <Modal
    open={visible}
    title={
      <span>
        <ExclamationCircleOutlined
          style={{ color: "#faad14", marginRight: 8 }}
        />
        Warning
      </span>
    }
    onOk={onClose}
    onCancel={onClose}
    footer={[
      <Button key="ok" type="primary" onClick={onClose}>
        OK
      </Button>,
    ]}
  >
    <div>
      {Array.isArray(message) ? (
        message.map((msg, index) => (
          <p key={index} style={{ marginBottom: 8 }}>
            {msg}
          </p>
        ))
      ) : (
        <p>{message}</p>
      )}
    </div>
  </Modal>
);

export default React.memo(WarningModal);


