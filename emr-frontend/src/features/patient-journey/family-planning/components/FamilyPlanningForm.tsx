import React, { useMemo, useState } from "react";
import { Form, Tabs, Button } from "antd";
import TopBar from "@/components/ui/TopBar";
import { EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearFormData } from "@/redux/store/slices/formDataSlice";
import FamilyPlanningFields from "./FamilyPlanningFields";
import {
  usePostFamilyPlanningRecordMutation,
  useUpdateFamilyPlanningRecordMutation,
} from "../../services/familyplanningApi";
import { useGlobalNotification } from "@/hooks/useNotification";
import { HttpStatus } from "@/data/types";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import {
  SERVICES_STATUS,
  ServiceType,
  VISIT_STATUS,
} from "../../data/constants";

import Loader from "@/components/shared/Loader";
import {
  transformFamilyPlanningFormDataToApi,
  transformFamilyPlanningUpdateApi,
} from "../../utils/familyPlanningFormTransformers";

type FamilyPlanningProps = {
  form: any;
  formFields: any[];
  handleFormValuesChange: (values: any, changedValues: any) => void;
  patientId: Number;
  formDraft: any;
  larcContraceptiveOptions: any[];
  shortTermContraceptiveOptions: any[];
  selectedPatientData: any;
  notifyChangeInForm: any;
  isServiceCompleted: boolean;
};

const FamilyPlanningForm: React.FC<FamilyPlanningProps> = ({
  formFields,
  patientId,
  isServiceCompleted,
  form,
  larcContraceptiveOptions,
  shortTermContraceptiveOptions,
  selectedPatientData,
  handleFormValuesChange,
  notifyChangeInForm,
  formDraft,
}: any) => {
  //For form handling

  //----------- states ----------- //
  const [activeKey, setActiveKey] = useState("1");
  const [editMode, setEditMode] = useState(
    !isServiceCompleted || Object.keys(formDraft).length > 0,
  );

  //----------- redux & hooks ----------- //
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const showNotification = useGlobalNotification();

  const [postFamilyPlanningRecord, { isLoading: isPostFpLoading }] =
    usePostFamilyPlanningRecordMutation();
  const [updateFamilyPlanningRecord, { isLoading: isUpdateFpLoading }] =
    useUpdateFamilyPlanningRecordMutation();
  // ✅ Fetch FP record for this visit

  const filteredFormFields = useMemo(() => {
    return formFields.map((tab: any) => ({
      ...tab,
      fields: (tab.fields || []).filter((field: any) => {
        if (!field.visibleIf) return true;
        if (typeof field.visibleIf !== "function") return true;
        const completeFormValues = form.getFieldsValue(true);
        return field.visibleIf(completeFormValues);
      }),
    }));
  }, [formFields, notifyChangeInForm]);

  const validateAllFields = async () => {
    try {
      const allValues = form.getFieldsValue(true);

      // show registered fields & errors
      await form.validateFields(allValues); // ✅ all fields

      return { isValid: true };
    } catch (errorInfo: any) {
      const firstErrorField = errorInfo.errorFields?.[0]?.name?.[0];

      if (firstErrorField) {
        const tabWithError = formFields.find((tab: any) => {
          const hasField = tab.fields?.some(
            (field: { name: string }) => field.name === firstErrorField,
          );

          return hasField;
        });

        let errorTabKey = null;
        if (tabWithError) {
          errorTabKey = tabWithError.tabKey;
        }

        return {
          isValid: false,
          errorTab: errorTabKey,
        };
      }
      return { isValid: false };
    }
  };

  const handleSubmit = async () => {
    const validation = await validateAllFields();

    if (!validation.isValid && validation.errorTab) {
      setActiveKey(validation.errorTab);
      return;
    }

    const completeFormValues = form.getFieldsValue();

    try {
      let response;
      if (isServiceCompleted) {
        let payLoad = transformFamilyPlanningUpdateApi(
          completeFormValues,
          selectedPatientData?.appointmentId,
        );
        response = await updateFamilyPlanningRecord({
          appointment_service_id:
            selectedPatientData?.appointmentServices?.find(
              (s: any) => s.service?.name === ServiceType.FAMILY_PLANNING,
            )?.id,
          data: payLoad,
        }).unwrap();
      } else {
        let payLoad = transformFamilyPlanningFormDataToApi(
          completeFormValues,
          selectedPatientData?.appointmentId,
          larcContraceptiveOptions,
          shortTermContraceptiveOptions,
        );
        response = await postFamilyPlanningRecord(payLoad).unwrap();
      }

      if (
        response.status === HttpStatus.OK ||
        response.status === HttpStatus.CREATED
      ) {
        showNotification(
          "success",
          isServiceCompleted
            ? "Family Planning record updated successfully."
            : "Family Planning record saved successfully.",
        );

        const existingFpService =
          selectedPatientData?.appointmentServices?.find(
            (s: any) => s.service?.name === ServiceType.FAMILY_PLANNING,
          );

        const familyPlanningServiceSummary = {
          id: response.data?.id ?? existingFpService?.id,
          status: SERVICES_STATUS.COMPLETED,
          service: {
            id: selectedPatientData?.selectedServiceIdFromCard,
            name: ServiceType.FAMILY_PLANNING,
          },
        };

        const existingServices = selectedPatientData?.appointmentServices || [];

        const updatedAppointmentServices = existingServices.some(
          (s: any) => s.service?.name === ServiceType.FAMILY_PLANNING,
        )
          ? existingServices.map((s: any) =>
              s.service?.name === ServiceType.FAMILY_PLANNING
                ? { ...s, ...familyPlanningServiceSummary }
                : s,
            )
          : [...existingServices, familyPlanningServiceSummary];

        dispatch(
          setSelectedPatientData({
            ...selectedPatientData,
            appointmentServices: updatedAppointmentServices,
            appointmentStatus: SERVICES_STATUS.COMPLETED,
          }),
        );

        setEditMode(false);

        dispatch(
          clearFormData({
            formKey: "familyPlanning",
            patientId,
          }),
        );

        navigate(`/patient/${patientId}/services`);
      } else {
        const message = Array.isArray(response?.message)
          ? response.message.join(", ") // join all error messages into one string
          : response?.message || "Issue in submitting family planning record";
        showNotification("error", message);
      }
    } catch (error: any) {
      const message = Array.isArray(error?.data?.message)
        ? error.data.message.join(", ")
        : error?.data?.message ||
          error?.message ||
          "Issue in submitting family planning record";

      showNotification("error", "Family planning failed", message);
    }
  };

  if (isPostFpLoading || isUpdateFpLoading) {
    return <Loader />;
  }

  return (
    <>
      <TopBar
        title="Family Planning"
        onIconClick={() => navigate(-1)}
        showPatientInfo
        showIconButton
      />

      {isServiceCompleted &&
        selectedPatientData?.visit?.status !== VISIT_STATUS.DISPATCHED && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <Button
              icon={<EditOutlined />}
              type="default"
              size="small"
              onClick={() => setEditMode((prev) => !prev)}
            >
              Edit
            </Button>
          </div>
        )}

      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 12 }}
        onValuesChange={handleFormValuesChange}
      >
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={[
            {
              key: "1",
              label: "Family Planning",
              children: (
                <FamilyPlanningFields
                  formFields={filteredFormFields}
                  editMode={editMode}
                  formValues={notifyChangeInForm}
                  isServiceCompleted={isServiceCompleted}
                />
              ),
            },
          ]}
        />
        {selectedPatientData?.visit?.status !== VISIT_STATUS.DISPATCHED && (
          <div style={{ textAlign: "right", marginTop: 24 }}>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isPostFpLoading || isUpdateFpLoading}
              disabled={!editMode}
            >
              {isServiceCompleted ? "Edit" : "Save"}
            </Button>
          </div>
        )}
      </Form>
    </>
  );
};

export default FamilyPlanningForm;
