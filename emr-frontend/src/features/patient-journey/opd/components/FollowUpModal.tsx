import React from "react";
import { Modal, Button } from "antd";

interface FollowUpDecisionModalProps {
  open: boolean;
  onClose: () => void;
  onNewVisit: () => void;
  onFollowUpVisit: () => void;
}

const FollowUpDecisionModal: React.FC<FollowUpDecisionModalProps> = ({
  open,
  onClose,
  onNewVisit,
  onFollowUpVisit,
}) => {
  return (
    <Modal open={open} footer={null} onCancel={onClose} centered title="">
      <p
        style={{ color: "var(--color-green-custom)" }}
        className="mb-4 text-base"
      >
        Do you want to begin a <b>new visit</b> or continue with the patient's
        <b> follow-up visit</b>?
      </p>

      <div className="flex justify-end gap-3">
        <Button onClick={onNewVisit} type="default">
          Begin New Visit
        </Button>

        <Button onClick={onFollowUpVisit} type="primary">
          Continue Follow-Up Visit
        </Button>
      </div>
    </Modal>
  );
};

export default FollowUpDecisionModal;
