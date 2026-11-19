import React, { useMemo, useState } from "react";
import { Form, Tabs, Button } from "antd";
import TopBar from "@/components/ui/TopBar";
import MedicineDispensing from "./MedicineDispensing";
import { useNavigate } from "react-router-dom";
import {
  SERVICES_STATUS,
  ServiceType,
  VISIT_STATUS,
} from "../../data/constants";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import { transformFormDataToDispneserApi } from "../../utils/dispenserFormTransformers";
import { useDispatch } from "react-redux";
import { usePostDispensingMutation } from "../../services/dispenserApi";
import Loader from "@/components/shared/Loader";
import { clearFormData } from "@/redux/store/slices/formDataSlice";
import { HttpStatus } from "@/data/types";
import { useGlobalNotification } from "@/hooks/useNotification";

type DispensorFormProps = {
  form: any;
  formFields: any[];
  handleFormValuesChange: (values: any, changedValues: any) => void;
  patientId: number;
  selectedPatientPrescibedMedicines: any[];
  formDraft: any;
  otcmedicinesOptions: any[];
  selectedPatientData: any;
  notifyChangeInForm: any;
  isServiceCompleted: boolean;
};

const DispensorForm: React.FC<DispensorFormProps> = ({
  form,
  formFields,
  handleFormValuesChange,
  patientId,
  selectedPatientPrescibedMedicines,
  selectedPatientData,
  notifyChangeInForm,
  otcmedicinesOptions,
  isServiceCompleted,
}) => {
  const [activeKey, setActiveKey] = useState<string>("1");
  // const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  const [postDispensing, { isLoading: postDispensingLoading }] =
    usePostDispensingMutation();

  const showNotification = useGlobalNotification();

  const filteredFormFields = useMemo(() => {
    return formFields.map((tab: any) => ({
      ...tab,
      fields: (tab.fields || []).filter((field: any) => {
        if (!field.visibleIf) return true;
        if (typeof field.visibleIf !== "function") return true;
        let completeFormValues = form.getFieldsValue(true);
        return field.visibleIf(completeFormValues);
      }),
    }));
  }, [formFields, notifyChangeInForm]);

  const dispatch = useDispatch();

  const validateCurrentTab = async () => {
    const currentTab = formFields.find((tab) => tab.tabKey === activeKey);
    const values = form.getFieldsValue(true);

    // Collect all field names of the current tab
    const fieldNames: any[] = [];

    currentTab?.fields?.forEach((field: any) => {
      if (field.type === "formList") {
        const listName = field.name;

        // Loop over list items
        (values[listName] || []).forEach((index: any) => {
          field.fields.forEach((childField: any) => {
            fieldNames.push([listName, index, childField.name]);
          });
        });
      } else if (field.name) {
        fieldNames.push(field.name);
      }
    });

    const finalNames = [...fieldNames];

    try {
      await form.validateFields(finalNames);
      return { isValid: true };
    } catch {
      return { isValid: false };
    }
  };

  const handleSubmit = async () => {
    const validation = await validateCurrentTab();

    if (!validation.isValid) {
      return;
    }

    const completeFormValues = form.getFieldsValue(true);

    try {
      let response;
      if (isServiceCompleted) {
        // let payLoad = transformFamilyPlanningUpdateApi(
        //   completeFormValues,
        //   selectedPatientData?.appointmentId
        // );
        // response = await updateFamilyPlanningRecord({
        //   appointment_service_id:
        //     selectedPatientData?.appointmentServices?.find(
        //       (s: any) => s.service?.name === ServiceType.FAMILY_PLANNING
        //     )?.id,
        //   // appointment_service_id:
        //   // selectedPatientData?.appointmentServices?.[0]?.id,
        //   data: payLoad,
        // }).unwrap();
      } else {
        let payLoad = transformFormDataToDispneserApi(
          completeFormValues,
          selectedPatientPrescibedMedicines,
          selectedPatientData?.appointmentId,
          patientId,
          otcmedicinesOptions,
        );

        response = await postDispensing(payLoad).unwrap();
      }

      if (
        response.status === HttpStatus.OK ||
        response.status === HttpStatus.CREATED
      ) {
        showNotification("success", "Otc medicine dispatched Successfully");

        const warnings = response.data?.warnings;
        if (Array.isArray(warnings) && warnings.length > 0) {
          warnings.forEach((msg: string) =>
            showNotification("warning", msg, undefined, 0),
          );
        }

        const existingFpService =
          selectedPatientData?.appointmentServices?.find(
            (s: any) => s.service?.name === ServiceType.MEDICINE_DISPENSING,
          );

        const familyPlanningServiceSummary = {
          id: response.data?.id ?? existingFpService?.id,
          status: SERVICES_STATUS.COMPLETED,
          service: {
            id: selectedPatientData?.selectedServiceIdFromCard,
            name: ServiceType.MEDICINE_DISPENSING,
          },
        };

        const existingServices = selectedPatientData?.appointmentServices || [];

        const updatedAppointmentServices = existingServices.some(
          (s: any) => s.service?.name === ServiceType.MEDICINE_DISPENSING,
        )
          ? existingServices.map((s: any) =>
              s.service?.name === ServiceType.MEDICINE_DISPENSING
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

        dispatch(
          setSelectedPatientData({
            ...selectedPatientData,
            appointmentServices: updatedAppointmentServices,
            appointmentStatus: SERVICES_STATUS.COMPLETED,
          }),
        );

        dispatch(
          clearFormData({
            formKey: "dispenseing",
            patientId,
          }),
        );

        navigate(`/patient/${patientId}/services`);
      } else {
        const message = Array.isArray(response?.message)
          ? response.message.join(", ") // join all error messages into one string
          : response?.message || "Issue in dispatching otc medicine";
        showNotification("error", message);
      }
    } catch (error: any) {
      const message = Array.isArray(error?.data?.message)
        ? error.data.message.join(", ")
        : error?.data?.message ||
          error?.message ||
          "Issue in dispatching otc medicine";

      showNotification("error", "Medicine dispatch failed", message);
    }
  };

  if (postDispensingLoading) {
    return <Loader />;
  }

  return (
    <>
      <TopBar
        title="Dispenser"
        onIconClick={() => navigate(-1)}
        showPatientInfo={true}
        showIconButton={true}
      />
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormValuesChange}
        style={{ marginTop: 12 }}
      >
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          onChange={setActiveKey}
          items={[
            {
              key: "1",
              label: "Medicine Dispensing",
              children: (
                <MedicineDispensing
                  formFields={filteredFormFields}
                  isServiceCompleted={isServiceCompleted}
                  formValues={notifyChangeInForm}
                />
              ),
            },
          ]}
        />
        {selectedPatientData?.visit?.status !== VISIT_STATUS.DISPATCHED && (
          <div style={{ textAlign: "right", marginTop: 24 }}>
            <Button
              type="primary"
              disabled={isServiceCompleted}
              // icon={editMode ? <SaveOutlined /> : undefined}
              onClick={handleSubmit}
            >
              {"Save"}
            </Button>
          </div>
        )}
      </Form>
    </>
  );
};

export default DispensorForm;
