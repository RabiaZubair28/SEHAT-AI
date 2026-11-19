import React, { useMemo } from "react";
import { Alert, Button, Form, Popconfirm, Tooltip } from "antd";
import { FormInstance } from "antd/es/form";
import { useNavigate } from "react-router-dom";
import MedicineBatchFields from "../../newBatchesRequest/components/MedicineBatchFields";
import type { MedicineBatch } from "@/features/admin/services/medicineBatchesApi";
import type { FormFieldConfig } from "@/data/types";
import { type EditBatchFormValues } from "../../constants/editBatchFieldsConstants";

type Props = {
  form: FormInstance<EditBatchFormValues>;
  fields: FormFieldConfig[];
  batch: MedicineBatch;
  isUpdating: boolean;
  isDeleting: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onSubmit: () => void;
  onDelete: () => void;
};

const EditBatchForm: React.FC<Props> = ({
  form,
  fields,
  batch,
  isUpdating,
  isDeleting,
  canEdit,
  canDelete,
  onSubmit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const otc = Form.useWatch("otc", form);

  const filteredFields = useMemo(() => {
    return fields.filter((field) => {
      if (!field.visibleIf) return true;
      if (typeof field.visibleIf !== "function") return true;
      return field.visibleIf(form.getFieldsValue(true));
    });
  }, [fields, form, otc]);

  return (
    <Form
      form={form}
      initialValues={{
        ...batch,
        expiryDate: batch.expiryDate ?? null,
        purchaseDate: batch.purchaseDate ?? null,
      }}
      layout="vertical"
      disabled={isUpdating || isDeleting}
    >
      <Summary batch={batch} />

      <div className="my-4">
        <Alert
          type="warning"
          showIcon
          message="OTC and OTC Limit Quantity apply to all batches of this medicine variant at this facility"
        />
      </div>

      <MedicineBatchFields
        formFieldsTab={{ fields: filteredFields }}
        formValues={form.getFieldsValue(true)}
      />

      <div className="flex justify-end gap-2 mt-6">
        {canDelete && (
          <Popconfirm
            title="Delete this batch?"
            description="This action cannot be undone."
            onConfirm={onDelete}
            okText="Delete"
            okType="danger"
            disabled={!batch.isDeletable}
          >
            <Tooltip
              title={
                !batch.isDeletable
                  ? "Delete is only allowed within 12 hours of creation"
                  : ""
              }
            >
              <Button
                type="primary"
                danger
                loading={isDeleting}
                disabled={!batch.isDeletable || isUpdating}
              >
                Delete
              </Button>
            </Tooltip>
          </Popconfirm>
        )}
        <Button
          onClick={() => navigate(-1)}
          disabled={isUpdating || isDeleting}
        >
          Cancel
        </Button>
        {canEdit && (
          <Tooltip
            title={
              !batch.isEditable
                ? "Edit is only allowed within 12 hours of creation"
                : ""
            }
          >
            <Button
              type="primary"
              loading={isUpdating}
              onClick={onSubmit}
              disabled={isDeleting || !batch.isEditable}
            >
              Update
            </Button>
          </Tooltip>
        )}
      </div>
    </Form>
  );
};

export default EditBatchForm;

const Summary = ({ batch }: { batch: MedicineBatch }) => {
  return (
    <div className="flex gap-6 mt-4 mb-4 p-3 bg-gray-100 rounded-md">
      <div>
        <span className="font-semibold mr-2">Medicine:</span>
        {batch.medicine.name}
      </div>
      <div>
        <span className="font-semibold mr-2">Variant:</span>
        {batch.variant.unit} - {batch.variant.strength}
      </div>
      <div>
        <span className="font-semibold mr-2">Facility:</span>
        {batch.facility.name}
      </div>
    </div>
  );
};
