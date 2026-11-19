import React, { useMemo } from "react";
import { Form, Tabs, Button } from "antd";
import TopBar from "@/components/ui/TopBar";
import WarningModal from "./WarningModal";
import { EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { clearFormData } from "@/redux/store/slices/formDataSlice";
import MedicalHistoryOpd from "./MedicalHistory";
import Vitals from "./Vitals";
import PrescriptionAndDiagnostics from "./PrescriptionAndDiagnostics";
import {
  SERVICES_STATUS,
  ServiceType,
  VISIT_STATUS,
} from "../../data/constants";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import { useGlobalNotification } from "@/hooks/useNotification";
import {
  usePostOpdRecordMutation,
  useUpdateOpdRecordMutation,
} from "../../services/opdServiceApi";
import Loader from "@/components/shared/Loader";
import { HttpStatus } from "@/data/types";
import { isLastTab } from "@/utils/helpers/formHelperMethods";
import {
  transformFormDataToOpdApi,
  transformUpdateFormDataToOpdApi,
} from "../../utils/opdFormTransformers";
import FollowUpDecisionModal from "./FollowUpModal";
import { clearFollowUpDecision } from "@/redux/store/slices/followUpRedux";

type WarningModalState = {
  message: string[];
  visible: boolean;
};

type OpdFormProps = {
  form: any;
  formFields: any[];
  handleFormValuesChange: (values: any, changedValues: any) => void;
  patientId: Number;
  followUpDesicion: string | null;
  formDraft: any;
  notifyChangeInForm: any;
  showFollowUpModal?: boolean;
  handleFollowUp: () => void;
  handleCloseModal: () => void;
  handleNewVisit: () => void;
  isServiceCompleted: boolean;
  warningModalStates: WarningModalState;
  setWarningModalStates: React.Dispatch<
    React.SetStateAction<WarningModalState>
  >;
};

const OpdForm: React.FC<OpdFormProps> = ({
  form,
  formFields,
  formDraft,
  showFollowUpModal,
  handleFollowUp,
  handleNewVisit,
  handleCloseModal,
  handleFormValuesChange,
  isServiceCompleted,
  warningModalStates,
  notifyChangeInForm,
  setWarningModalStates,
  patientId,
}: any) => {
  const [activeKey, setActiveKey] = React.useState<string>("1");
  const [editMode, setEditMode] = React.useState(
    !isServiceCompleted || Object.keys(formDraft).length > 0,
  );
  const navigate = useNavigate();
  const showNotification = useGlobalNotification();

  const [postOpdRecord, { isLoading: isPostOpdLoading }] =
    usePostOpdRecordMutation();
  const [updateOpdRecord, { isLoading: isUpdateOpdLoading }] =
    useUpdateOpdRecordMutation();

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

  const selectedPatientData = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData,
  );

  const dispatch = useDispatch();

  const validateAllFields = async () => {
    try {
      const allValues = form.getFieldsValue();
      await form.validateFields(allValues);

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

  const validateCurrentTab = async () => {
    const currentTab = formFields.find((tab: any) => tab.tabKey === activeKey);
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

  const goToNextTab = async () => {
    const currentTabValidation = await validateCurrentTab();
    if (!currentTabValidation.isValid) return;

    const currentKeyNum = Number(activeKey);
    if (currentKeyNum < formFields.length) {
      setActiveKey((currentKeyNum + 1).toString());
    }
  };

  const handleSubmit = async () => {
    if (!editMode) {
      goToNextTab();
    } else {
      const validation = await validateAllFields();
      if (!validation.isValid && validation.errorTab) {
        setActiveKey(validation.errorTab);
        return;
      } else if (isLastTab(activeKey, formFields)) {
        const completeFormValues = form.getFieldsValue(true);

        try {
          let response;

          if (isServiceCompleted) {
            const appointmentServiceId =
              selectedPatientData?.appointmentServices?.find(
                (s: any) => s.service?.name === ServiceType.OPD,
              )?.id;

            if (!appointmentServiceId) {
              throw new Error("Appointment service ID not found.");
            }
            const updatePayLoad = transformUpdateFormDataToOpdApi(
              completeFormValues,
              appointmentServiceId,
              selectedPatientData?.age,
            );

            response = await updateOpdRecord({
              appointment_service_id: appointmentServiceId,
              data: updatePayLoad,
            }).unwrap();
          } else {
            const payload = transformFormDataToOpdApi(
              completeFormValues,
              Number(selectedPatientData?.appointmentId),
              selectedPatientData?.age,
            );
            response = await postOpdRecord(payload).unwrap();
          }

          if (
            response.httpStatus === HttpStatus.OK ||
            response.httpStatus === HttpStatus.CREATED
          ) {
            showNotification(
              "success",
              isServiceCompleted
                ? "Opd record updated successfully."
                : "Opd record saved successfully.",
            );

            const existingOpdService =
              selectedPatientData?.appointmentServices?.find(
                (s: any) => s.service?.name === ServiceType.OPD,
              );

            const opdServiceSummary = {
              id: response.data?.id ?? existingOpdService?.id,
              status: SERVICES_STATUS.COMPLETED,
              service: {
                id: selectedPatientData?.selectedServiceIdFromCard,
                name: ServiceType.OPD,
              },
            };

            const existingServices =
              selectedPatientData?.appointmentServices || [];

            const updatedAppointmentServices = existingServices.some(
              (s: any) => s.service?.name === ServiceType.OPD,
            )
              ? existingServices.map((s: any) =>
                  s.service?.name === ServiceType.OPD
                    ? { ...s, ...opdServiceSummary }
                    : s,
                )
              : [...existingServices, opdServiceSummary];

            dispatch(
              setSelectedPatientData({
                ...selectedPatientData,
                appointmentServices: updatedAppointmentServices,
                appointmentStatus: SERVICES_STATUS.COMPLETED,
              }),
            );
            dispatch(clearFollowUpDecision({ patientId: patientId }));

            setEditMode(false);
            dispatch(
              clearFormData({
                formKey: `opdForm`,
                patientId,
              }),
            );

            navigate(`/patient/${patientId}/services`);
          } else {
            const message = Array.isArray(response?.message)
              ? response.message.join(", ")
              : response?.message || "Issue in submitting Opd record";
            showNotification("error", message);
          }
        } catch (error: any) {
          const message = Array.isArray(error?.data?.message)
            ? error.data.message.join(", ")
            : error?.data?.message ||
              error?.message ||
              "Issue in submitting Opd record";

          showNotification("error", "Opd failed", message);
        } finally {
        }
      }
    }
  };

  const tabItems = [
    {
      key: "1",
      label: "Vitals",
      children: <Vitals formFields={filteredFormFields} editMode={editMode} />,
      forceRender: true,
    },
    {
      key: "2",
      label: "Medical History & Symptoms",
      children: (
        <MedicalHistoryOpd
          formFields={filteredFormFields}
          editMode={editMode}
        />
      ),
      forceRender: true,
    },

    {
      key: "3",
      label: "Prescription & Diagnostics",
      children: (
        <PrescriptionAndDiagnostics
          formFields={filteredFormFields}
          editMode={editMode}
          formValues={notifyChangeInForm}
        />
      ),
      forceRender: true,
    },
  ];

  if (isPostOpdLoading || isUpdateOpdLoading) {
    return <Loader />;
  }

  return (
    <>
      <WarningModal
        visible={warningModalStates.visible}
        message={warningModalStates.message}
        onClose={() =>
          setWarningModalStates({ ...warningModalStates, visible: false })
        }
      />
      <FollowUpDecisionModal
        open={showFollowUpModal}
        onFollowUpVisit={handleFollowUp}
        onNewVisit={handleNewVisit}
        onClose={handleCloseModal}
      />
      <TopBar
        title="Opd"
        onIconClick={() => navigate(-1)}
        showPatientInfo={true}
        showIconButton={true}
      />
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
      >
        {isServiceCompleted &&
          selectedPatientData?.visit?.status !== VISIT_STATUS.DISPATCHED && (
            <Button
              icon={<EditOutlined />}
              type="default"
              size="small"
              onClick={() => setEditMode((prev) => !prev)}
            >
              Edit
            </Button>
          )}
      </div>
      <Form
        onValuesChange={handleFormValuesChange}
        style={{ marginTop: "12px" }}
        form={form}
        layout="vertical"
      >
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          onChange={setActiveKey}
          items={tabItems}
        />
        {selectedPatientData?.visit?.status !== VISIT_STATUS.DISPATCHED &&
          (!isLastTab(activeKey, formFields) ? (
            <div style={{ textAlign: "right", marginTop: 24 }}>
              <Button
                type="primary"
                onClick={goToNextTab}

                // disabled={!editMode}
              >
                Next
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: "right", marginTop: 24 }}>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={isPostOpdLoading || isUpdateOpdLoading}
                disabled={!editMode}
              >
                {isServiceCompleted ? "Edit" : "Save"}
              </Button>
            </div>
          ))}
      </Form>
    </>
  );
};

export default OpdForm;
