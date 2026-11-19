import React from "react";
import { Button, Popconfirm, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/data/routes";

type BatchActionsProps = {
  record: any;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (record: any) => void;
};

const BatchActions: React.FC<BatchActionsProps> = ({
  record,
  canEdit,
  canDelete,
  onDelete,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-1">
      {canEdit && (
        <Tooltip
          title={
            !record.isEditable
              ? "Edit is only allowed within 12 hours of creation"
              : ""
          }
        >
          <Button
            type="link"
            size="small"
            disabled={!record.isEditable}
            onClick={() =>
              navigate(
                ROUTES.ADMIN_STOCK_MANAGEMENT_EDIT.replace(
                  ":id",
                  String(record.id),
                ),
              )
            }
          >
            Edit
          </Button>
        </Tooltip>
      )}
      {canDelete && (
        <Popconfirm
          title="Delete this batch?"
          description="This action cannot be undone."
          onConfirm={() => onDelete(record)}
          okText="Delete"
          okType="danger"
          disabled={!record.isDeletable}
        >
          <Tooltip
            title={
              !record.isDeletable
                ? "Delete is only allowed within 12 hours of creation"
                : ""
            }
          >
            <Button type="link" danger size="small" disabled={!record.isDeletable}>
              Delete
            </Button>
          </Tooltip>
        </Popconfirm>
      )}
    </div>
  );
};

export default BatchActions;
