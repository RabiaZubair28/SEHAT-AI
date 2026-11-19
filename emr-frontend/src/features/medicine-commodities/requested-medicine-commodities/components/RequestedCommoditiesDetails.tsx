import { Form, Row, Col, Button, Input, Modal } from "antd";
import TopBar from "@/components/ui/TopBar";
import { useNavigate, useParams } from "react-router-dom";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";
import { ROUTES } from "@/data/routes";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { HttpStatus, Roles } from "@/data/types";
import { useEffect, useMemo, useState } from "react";
import {
  setCommoditiesDetailsFormFields,
  STATUS,
  transformCommodityRequestPayloadWithRejected,
  mapRequestedCommoditiesToFormValues,
} from "../../constants/CommoditiesDetailedConstants";

import {
  useGetCommodityRequestByIdQuery,
  useUpdateCommodityRequestStatusMutation,
} from "../../services/medicinecommoditiyApi";
import Loader from "@/components/shared/Loader";
import { useGlobalNotification } from "@/hooks/useNotification";
import { useGetAllMedicineInventoryQuery } from "@/features/inventory/service/medicineInventoryApi";

export default function RequestedCommoditiesDetails() {
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const navigate = useNavigate();
  const [formFields, setFormFields] = useState<any[]>([]);

  const user = useSelector(
    (state: RootState) => state.authUser.user ?? state.authAdmin.admin,
  );
  const isApprover =
    user?.role?.name === Roles.DISPENSER ||
    user?.role?.name === Roles.FACILITY_INCHARGE;
  const listRoute =
    user?.role?.name === Roles.FACILITY_INCHARGE
      ? ROUTES.ADMIN_COMMODITY_REQUESTS
      : ROUTES.COMMODITY_REQUESTS;

  const [rejectedItems, setRejectedItems] = useState<number[]>([]);
  const [confirmRejectItem, setConfirmRejectItem] = useState<{
    index: number;
    itemId: number;
  } | null>(null);

  const { requestId } = useParams<{ requestId: string }>();

  const { data: medicinesRequestedByRequestID, isLoading } =
    useGetCommodityRequestByIdQuery(Number(requestId), {
      skip: !Number(requestId),
    });

  const [
    updateCommodityStatusApi,
    { isLoading: updateCommodityStatusLoading },
  ] = useUpdateCommodityRequestStatusMutation();
  const { refetch: refetchInventory } = useGetAllMedicineInventoryQuery();

  // Map commodities to form values (now includes commodities array)
  const mappedCommodities = useMemo(() => {
    if (!medicinesRequestedByRequestID?.items) return {};
    return mapRequestedCommoditiesToFormValues(
      medicinesRequestedByRequestID.items,
      medicinesRequestedByRequestID.rejectionReason,
    );
  }, [medicinesRequestedByRequestID]);

  // Initialize rejected items from API
  useEffect(() => {
    if (medicinesRequestedByRequestID?.items) {
      const initiallyRejected = medicinesRequestedByRequestID.items
        .filter((item) => item.status === STATUS.REJECTED)
        .map((item) => item.id);
      setRejectedItems(initiallyRejected);
    }
  }, [medicinesRequestedByRequestID]);

  const showNotification = useGlobalNotification();

  // Get current form values

  // Set form fields with table structure
  useEffect(() => {
    const isApproved =
      medicinesRequestedByRequestID?.status === STATUS.APPROVED ||
      medicinesRequestedByRequestID?.status === STATUS.PARTIALLY_APPROVED;

    const showDispensedFields = isApprover || isApproved;

    const fields = setCommoditiesDetailsFormFields(
      medicinesRequestedByRequestID?.rejectionReason,
      medicinesRequestedByRequestID?.status,
      isApprover,
      onRejectItemClick,
      onQuantityDispensedChange,
      rejectedItems,
      showDispensedFields,
    );

    setFormFields(fields);
  }, [
    medicinesRequestedByRequestID?.rejectionReason,
    medicinesRequestedByRequestID?.status,
    isApprover,
    rejectedItems,
  ]);

  // Set form values
  useEffect(() => {
    if (!medicinesRequestedByRequestID) return;

    if (isApprover) {
      form.setFieldsValue({
        issued_to: medicinesRequestedByRequestID.requesterName ?? "N/A",
        rejection_reason:
          medicinesRequestedByRequestID.rejectionReason || "N/A",
        purpose: medicinesRequestedByRequestID.purpose,
        ...mappedCommodities,
      });
    } else {
      const formData: any = {
        rejection_reason:
          medicinesRequestedByRequestID.rejectionReason || "N/A",
        purpose: medicinesRequestedByRequestID.purpose,
        ...mappedCommodities,
      };

      if (medicinesRequestedByRequestID.status === "PENDING") {
        formData.issued_to = medicinesRequestedByRequestID.issuedTo ?? "N/A";
      }

      if (
        medicinesRequestedByRequestID.status === STATUS.APPROVED ||
        medicinesRequestedByRequestID.status === STATUS.REJECTED ||
        medicinesRequestedByRequestID.status === STATUS.PARTIALLY_APPROVED
      ) {
        formData.issue_from = medicinesRequestedByRequestID.issueFrom ?? "N/A";
      }

      form.setFieldsValue(formData);
    }
  }, [form, mappedCommodities, medicinesRequestedByRequestID, isApprover]);

  const onRejectItemClick = (index: number, itemId: number) => {
    setConfirmRejectItem({ index, itemId });
  };

  const handleConfirmRowReject = () => {
    if (!confirmRejectItem) return;

    const { index, itemId } = confirmRejectItem;

    // Add to rejected items
    setRejectedItems((prev) => {
      if (prev.includes(itemId)) return prev;
      return [...prev, itemId];
    });

    // Update the commodity item in the commodities array
    const commodities = form.getFieldValue("commodities") || [];
    if (commodities[index]) {
      // Create a new array with updated item
      const updatedCommodities = [...commodities];
      updatedCommodities[index] = {
        ...updatedCommodities[index],
        isRejected: true,
        quantity_Dispensed: null,
      };
    }

    setConfirmRejectItem(null);
  };

  const onQuantityDispensedChange = (index: number, value: number) => {
    // Update the commodity item in the commodities array
    const commodities = form.getFieldValue("commodities") || [];
    if (commodities[index]) {
      // Create a new array with updated item
      const updatedCommodities = [...commodities];
      updatedCommodities[index] = {
        ...updatedCommodities[index],
        quantity_Dispensed: value,
      };
    }
  };

  const allItemsRejected =
    medicinesRequestedByRequestID?.items?.length === rejectedItems.length;
  const canApprove = !allItemsRejected;

  const canDispenseMedicine =
    isApprover &&
    medicinesRequestedByRequestID?.status !== STATUS.APPROVED &&
    medicinesRequestedByRequestID?.status !== STATUS.PARTIALLY_APPROVED;

  const validateForm = async () => {
    try {
      await form.validateFields();
      return { isValid: true };
    } catch {
      return { isValid: false };
    }
  };

  const handleApproveRequest = () => {
    Modal.confirm({
      title: "Are you sure you want to approve this request?",
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        try {
          const validation = await validateForm();
          if (!validation.isValid) return;

          const payload = transformCommodityRequestPayloadWithRejected(
            medicinesRequestedByRequestID,
            form.getFieldsValue(),
            rejectedItems,
            "",
            STATUS.APPROVED,
          );

          const response = await updateCommodityStatusApi({
            id: Number(requestId),
            payload,
          });

          onResponseSuccess(response);
        } catch (err) {
          onResponseError(err);
        }
      },
    });
  };

  const handleRejectRequest = async () => {
    Modal.confirm({
      title: "Are you sure you want to reject commodities?",
      okText: "Yes",
      cancelText: "No",
      content: (
        <Form form={modalForm} layout="vertical">
          <Form.Item
            name="rejectionReason"
            label="Rejection Reason"
            rules={[{ required: true, message: "Please provide a reason" }]}
          >
            <Input.TextArea rows={3} placeholder="Enter rejection reason" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          const values = await modalForm.validateFields();
          const rejectionReason = values.rejectionReason;

          const payload = transformCommodityRequestPayloadWithRejected(
            medicinesRequestedByRequestID,
            form.getFieldsValue(),
            rejectedItems,
            rejectionReason,
            STATUS.REJECTED,
          );

          const response = await updateCommodityStatusApi({
            id: Number(requestId),
            payload,
          });

          onResponseSuccess(response);
        } catch (err: any) {
          if (err.errorFields) return Promise.reject();
          onResponseError(err);
        }
      },
    });
  };

  const onResponseSuccess = (response: any) => {
    if (
      response?.data?.httpStatus === HttpStatus.OK ||
      response?.data?.httpStatus === HttpStatus.CREATED
    ) {
      showNotification("success", "Commodity request updated successfully");
      refetchInventory();
      navigate(listRoute);
    } else {
      const errorMessageSource = response?.error?.data?.message;
      const message = Array.isArray(errorMessageSource)
        ? errorMessageSource.join(", ")
        : errorMessageSource || "Issue in updating request";
      showNotification("error", "Commodity request failed", message);
    }
  };

  const onResponseError = (error: any) => {
    const errorMessageSource = error?.error?.data?.message;
    const message = Array.isArray(errorMessageSource)
      ? errorMessageSource.join(", ")
      : errorMessageSource || "Issue in updating request";

    showNotification("error", "Commodity request failed", message);
  };

  if (isLoading || updateCommodityStatusLoading) return <Loader />;

  return (
    <>
      <TopBar
        title="Commodities Details"
        showIconButton
        onIconClick={() => navigate(listRoute)}
      />

      <Form style={{ marginTop: 12 }} form={form} layout="vertical">
        <Row gutter={16}>
          {formFields.map((field: any, index: number) => {
            if (field.type === "table") {
              return (
                <Col key={field.name || index} span={24}>
                  {FormGenerator({
                    ...field,
                    formValues: form.getFieldsValue(["commodities"]),
                    disabled: field?.disabled || !canDispenseMedicine,
                  })}
                </Col>
              );
            }

            return (
              <Col
                key={field.name || index}
                xs={24}
                sm={24}
                md={field.colSpan || 12}
                lg={field.colSpan || 12}
                style={{ marginBottom: 16 }}
              >
                {FormGenerator({
                  ...field,
                  disabled: field?.disabled,
                })}
              </Col>
            );
          })}
        </Row>
      </Form>

      {canDispenseMedicine && (
        <Row gutter={16} style={{ marginTop: 16, justifyContent: "flex-end" }}>
          <Col>
            <Button type="primary" onClick={handleRejectRequest}>
              Reject All
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={handleApproveRequest}
              disabled={!canApprove}
            >
              Approve
            </Button>
          </Col>
        </Row>
      )}

      <Modal
        open={!!confirmRejectItem}
        title="Are you sure you want to reject this commodity?"
        onCancel={() => setConfirmRejectItem(null)}
        onOk={handleConfirmRowReject}
        okText="Yes"
        cancelText="No"
      />
    </>
  );
}
