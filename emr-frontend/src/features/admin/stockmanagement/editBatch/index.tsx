import Loader from "@/components/shared/Loader";
import TopBar from "@/components/ui/TopBar";
import {
  editBatchFields,
  type EditBatchFormValues,
} from "../constants/editBatchFieldsConstants";
import { Alert, Form } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/data/routes";
import {
  useGetMedicineBatchByIdQuery,
  useUpdateMedicineBatchMutation,
  useDeleteMedicineBatchMutation,
} from "@/features/admin/services/medicineBatchesApi";
import { useGlobalNotification } from "@/hooks/useNotification";
import { extractErrorMessage } from "@/utils/helpers/extractErrorMessage";
import { usePermissionCheck } from "@/hooks/usePermission";
import { ROUTE_KEYS } from "@/data/routeKey";
import EditBatchForm from "./components/EditBatchForm";

export default function EditMedicineBatch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<EditBatchFormValues>();
  const showNotification = useGlobalNotification();
  const canEdit = usePermissionCheck(ROUTE_KEYS.UPDATE_MEDICINE_BATCH);
  const canDelete = usePermissionCheck(ROUTE_KEYS.DELETE_A_MEDICINE_BATCH_BY_ID);

  const batchId = Number(id);

  const {
    data: batch,
    isLoading: isLoadingBatch,
    isError,
  } = useGetMedicineBatchByIdQuery(batchId, { skip: !batchId });

  const [updateBatch, { isLoading: isUpdating }] =
    useUpdateMedicineBatchMutation();

  const [deleteBatch, { isLoading: isDeleting }] =
    useDeleteMedicineBatchMutation();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await updateBatch({ id: batchId, body: values }).unwrap();
      showNotification("success", "Medicine Batch Updated Successfully");
      navigate(ROUTES.ADMIN_STOCK_MANAGEMENT);
    } catch (error: any) {
      showNotification("error", "Update Failed", extractErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBatch(batchId).unwrap();
      showNotification("success", "Medicine Batch Deleted Successfully");
      navigate(ROUTES.ADMIN_STOCK_MANAGEMENT);
    } catch (error: any) {
      showNotification("error", "Delete Failed", extractErrorMessage(error));
    }
  };

  if (isLoadingBatch) return <Loader />;

  return (
    <div className="space-y-4">
      <TopBar
        title="Edit Medicine Batch"
        onIconClick={() => navigate(-1)}
        showPatientInfo={false}
        showIconButton={true}
      />
      {isError || !batch ? (
        <Alert
          className="text-center"
          type="error"
          message="Failed to load medicine batch details"
        />
      ) : (
        <EditBatchForm
          form={form}
          fields={editBatchFields}
          batch={batch}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          canEdit={canEdit}
          canDelete={canDelete}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
