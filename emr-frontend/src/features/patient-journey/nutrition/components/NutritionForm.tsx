import React, { useMemo } from "react";
import { Form, Tabs, Button, Tooltip } from "antd";
import TopBar from "@/components/ui/TopBar";

import WarningModal from "@/components/shared/WarningModal";
import { EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { clearFormData } from "@/redux/store/slices/formDataSlice";
import PatientAddmissionDetails from "./PatientAddmissionDetails";
import VitalsAndAssesments from "./VitalsAndAssesments";
import SupplementsPrescriptions from "./SupplementsPresciptions";
import { useGlobalNotification } from "@/hooks/useNotification";
import {
  usePostNutritionRecordMutation,
  useUpdateNutritionRecordMutation,
} from "../../services/nutritionServiceApi";
import {
  SERVICES_STATUS,
  ServiceType,
  VISIT_STATUS,
} from "../../data/constants";
import Counsling from "./Counsling";
import AdvisorErrorBoundary from "./AdvisorErrorBoundary";
import { NutritionAdvisor, missingEncounterFields } from "@health-advisor";
import {
  transformFormDataToAdvisorInput,
  transformFormDataToNutritionApi,
  transformUpdateFormDataToNutritionApi,
} from "../../utils/nutritionFormTransformers";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";

// The Advisor tab sits after the form tabs and has its own save workflow.
const ADVISOR_TAB_KEY = "advisor";

type WarningModalState = {
  message: string[];
  visible: boolean;
};

type NutritionFormProps = {
  form: any;
  formFields: any[];
  handleFormValuesChange: (values: any, changedValues: any) => void;
  patientId: Number;
  formDraft: any;
  notifyChangeInForm: any;
  supplementOptions: any[];
  isServiceCompleted: boolean;
  warningModalStates: WarningModalState;
  setWarningModalStates: React.Dispatch<
    React.SetStateAction<WarningModalState>
  >;
};

const NutritionForm: React.FC<NutritionFormProps> = ({
  form,
  formFields,
  formDraft,
  handleFormValuesChange,
  supplementOptions,
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
  const dispatch = useDispatch();

  const [postNutritionRecord, { isLoading: isPostNutritionLoading }] =
    usePostNutritionRecordMutation();
  const [updateNutritionRecord, { isLoading: isUpdateNutritionLoading }] =
    useUpdateNutritionRecordMutation();

  const selectedPatientData = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData,
  );

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

  const validateCurrentTab = async () => {
    const currentTab = formFields.find((tab: any) => tab.tabKey === activeKey);
    const values = form.getFieldsValue(true);

    // Collect all field names of the current tab
    const fieldNames: any = [];

    currentTab?.fields?.forEach((field: any) => {
      if (field.type === "formList") {
        const listName = field.name;

        (values[listName] || []).forEach((_: any, index: number) => {
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
    } else {
      await openTab(ADVISOR_TAB_KEY);
    }
  };

  // The AI Nutrition Advisor tab stays greyed out until every required
  // Nutrition field is filled in.
  const openTab = async (key: string) => {
    if (key === ADVISOR_TAB_KEY && !advisorReady) return;
    setActiveKey(key);
  };
  const saveFinalRecord = async (): Promise<boolean> => {
    if (isServiceCompleted && !editMode) return true;
    const completeFormValues = form.getFieldsValue(true);

    try {
      let response: any;

      if (isServiceCompleted) {
        const payload = transformUpdateFormDataToNutritionApi(
          completeFormValues,
          selectedPatientData?.appointmentId,
          selectedPatientData?.age,
        );
        const appointmentServiceId =
          selectedPatientData?.appointmentServices?.find(
            (s: any) => s.service?.name === ServiceType.NUTRITION,
          )?.id;

        if (!appointmentServiceId) {
          console.error("Nutrition appointment service id does not exist");
          return false;
        }

        response = await updateNutritionRecord({
          appointment_service_id: appointmentServiceId,
          data: payload,
        }).unwrap();
      } else {
        const payload = transformFormDataToNutritionApi(
          completeFormValues,
          selectedPatientData?.appointmentId,
          supplementOptions,
          selectedPatientData?.age,
        );
        response = await postNutritionRecord(payload).unwrap();
      }

      showNotification(
        "success",
        "Nutrition Record",
        isServiceCompleted
          ? "Nutrition record updated successfully"
          : "Nutrition record saved successfully",
      );

      const existingNutritionService =
        selectedPatientData?.appointmentServices?.find(
          (s: any) => s.service?.name === ServiceType.NUTRITION,
        );

      const nutritionServiceSummary = {
        id: response?.id ?? existingNutritionService?.id,
        status: SERVICES_STATUS.COMPLETED,
        service: {
          id: selectedPatientData?.selectedServiceIdFromCard,
          name: ServiceType.NUTRITION,
        },
      };

      const existingServices =
        selectedPatientData?.appointmentServices || [];

      const updatedAppointmentServices = existingServices.some(
        (s: any) => s.service?.name === ServiceType.NUTRITION,
      )
        ? existingServices.map((s: any) =>
            s.service?.name === ServiceType.NUTRITION
              ? { ...s, ...nutritionServiceSummary }
              : s,
          )
        : [...existingServices, nutritionServiceSummary];

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
          formKey: `nutritionForm`,
          patientId,
        }),
      );
      return true;
    } catch (error: any) {
      const message = Array.isArray(error?.data?.message)
        ? error.data.message.join(", ")
        : error?.data?.message ||
          error?.message ||
          "Nutrition submission failed";

      showNotification("error", "Nutrition details could not be saved", message);
      return false;
    }
  };

  /** Checks every Nutrition tab; jumps to and highlights the first problem. */
  const validateWholeForm = async (purpose: string): Promise<boolean> => {
    try {
      const missing = missingEncounterFields(formFields, form.getFieldsValue(true));
      if (missing.length) {
        form.setFields(missing.map(({ name, errors }) => ({ name, errors })));
        setActiveKey(missing[0].tabKey);
        const tabs = [...new Set(missing.map(field => formFields.find((t: any) => t.tabKey === field.tabKey)?.title).filter(Boolean))];
        showNotification("warning", "Some required details are missing",
          `Please fill in the highlighted fields in ${tabs.length ? tabs.join(", ") : "the Nutrition tabs"} first.`);
        setTimeout(() => form.scrollToField(missing[0].name, { block: "center" }), 0);
        return false;
      }
      await form.validateFields();
      return true;
    } catch (error: any) {
      const name = error.errorFields?.[0]?.name;
      const tab = formFields.find((item: any) => item.fields?.some((field: any) => field.name === name?.[0]));
      if (tab) setActiveKey(tab.tabKey);
      showNotification("warning", "Complete required Nutrition fields", `Please complete the highlighted fields in the Nutrition tabs ${purpose}.`);
      if (name) setTimeout(() => form.scrollToField(name, { block: "center" }), 0);
      return false;
    }
  };

  // The Nutrition record never depends on the AI Advisor: it can always be
  // submitted directly, even when the Advisor is unavailable or fails.
  const [submittingRecord, setSubmittingRecord] = React.useState(false);
  const submitRecord = async () => {
    if (!(await validateWholeForm("before submitting the record"))) return;
    setSubmittingRecord(true);
    try {
      if (await saveFinalRecord()) navigate(`/patient/${patientId}/services`);
    } finally {
      setSubmittingRecord(false);
    }
  };
  const onLastFormTab = activeKey === String(formFields.length);
  const watchedValues = Form.useWatch((values) => values, { form, preserve: true });
  const advisorReady = React.useMemo(
    () => missingEncounterFields(formFields, form.getFieldsValue(true)).length === 0,
    [watchedValues, formFields], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const advisorLockedTip = "Fill in all required Nutrition details to open the AI Nutrition Advisor";
  const canSubmitRecord = !isServiceCompleted || editMode;

  const tabItems = [
    {
      key: "1",
      label: "Patient admission details",
      children: (
        <PatientAddmissionDetails
          formFields={filteredFormFields}
          editMode={editMode}
        />
      ),
      forceRender: true,
    },
    {
      key: "2",
      label: "Vitals & Assessment",
      children: (
        <VitalsAndAssesments
          formFields={filteredFormFields}
          editMode={editMode}
        />
      ),
      forceRender: true,
    },

    {
      key: "3",
      label: "Supplements",
      children: (
        <SupplementsPrescriptions
          formFields={filteredFormFields}
          editMode={editMode}
          formValues={notifyChangeInForm}
          isServiceCompleted={isServiceCompleted}
        />
      ),
      forceRender: true,
    },
    {
      key: "4",
      label: "Counseling",
      children: (
        <Counsling formFields={filteredFormFields} editMode={editMode} />
      ),
      forceRender: true,
    },
    {
      key: ADVISOR_TAB_KEY,
      label: advisorReady || activeKey === ADVISOR_TAB_KEY
        ? "AI Nutrition Advisor"
        // Plain grey (not antd's faint disabled style), so it stays readable;
        // clicks are ignored in openTab until the form is complete.
        : <Tooltip title={advisorLockedTip}><span style={{ color: "#8c8c8c", cursor: "not-allowed" }}>AI Nutrition Advisor</span></Tooltip>,
      children: <AdvisorErrorBoundary><NutritionAdvisor
        getNutritionInput={() => transformFormDataToAdvisorInput(form.getFieldsValue(true), selectedPatientData?.appointmentId, supplementOptions, selectedPatientData?.age)}
        onFinalize={saveFinalRecord}
        beforeGenerate={() => validateWholeForm("before generating AI advice")} /></AdvisorErrorBoundary>,
      destroyOnHidden: true,
    },
  ];


  return (
    <>
      <WarningModal
        visible={warningModalStates.visible}
        message={warningModalStates.message}
        onClose={() =>
          setWarningModalStates({ ...warningModalStates, visible: false })
        }
      />
      <TopBar
        title="Nutrition"
        onIconClick={() => navigate(-1)}
        showPatientInfo={true}
        showIconButton={true}
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
        onValuesChange={handleFormValuesChange}
        style={{ marginTop: "12px" }}
        form={form}
        layout="vertical"
      >
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          onChange={(key) => void openTab(key)}
          items={tabItems}
        />
        {selectedPatientData?.visit?.status !== VISIT_STATUS.DISPATCHED &&
          activeKey !== ADVISOR_TAB_KEY &&
          (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              {onLastFormTab ? (
                <>
                  <Button type="primary" onClick={submitRecord}
                    loading={submittingRecord || isPostNutritionLoading || isUpdateNutritionLoading}
                    disabled={!canSubmitRecord}>
                    {isServiceCompleted ? "Edit" : "Save"}
                  </Button>
                  <Tooltip title={advisorReady ? undefined : advisorLockedTip}>
                    <Button onClick={goToNextTab}
                      disabled={!advisorReady || isPostNutritionLoading || isUpdateNutritionLoading || submittingRecord}>
                      Go to AI Nutrition Advisor (optional)
                    </Button>
                  </Tooltip>
                </>
              ) : (
                <Button type="primary" onClick={goToNextTab}
                  disabled={isPostNutritionLoading || isUpdateNutritionLoading}>
                  Next
                </Button>
              )}
            </div>
          )}

      </Form>
    </>
  );
};

export default NutritionForm;
