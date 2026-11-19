import React, { useMemo } from "react";
import { Form, Tabs, Button } from "antd";
import TopBar from "@/components/ui/TopBar";
import VitalsAndScreening from "./VitalsAndScreening";
import Immunisation from "./Immunisation";
import BreastFeeding from "./BreastFeeding";
import PostPartumNutrition from "./PostPartumNutrition";
import PostPartumFamilyPlanning from "./PostPartumFamilyPlanning";
import WarningModal from "./WarningModal";
import { EditOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  usePostPncRecordMutation,
  useUpdatePncRecordMutation,
} from "../../services/pncServiceApi";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { clearFormData } from "@/redux/store/slices/formDataSlice";
import { useGlobalNotification } from "@/hooks/useNotification";
import { HttpStatus } from "@/data/types";
import {
  SERVICES_STATUS,
  ServiceType,
  VISIT_STATUS,
} from "../../data/constants";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import {
  transformFormDataToPncApi,
  transformUpdateFormDataToPncApi,
} from "../../utils/pncFormTransformers";
import Loader from "@/components/shared/Loader";
import { isLastTab } from "@/utils/helpers/formHelperMethods";

type WarningModalState = {
  message: string[];
  visible: boolean;
};

type PncFormProps = {
  form: any;
  formFields: any[];
  handleFormValuesChange: (values: any, changedValues: any) => void;
  patientId: Number;
  formDraft: any;
  notifyChangeInForm: any;
  isServiceCompleted: boolean;
  supplementOptions: any[];
  larcContraceptiveOptions: any[];
  shortTermContraceptiveOptions: any[];
  patientVaccinesInfo: any[];
  tdVaccines: any[];
  warningModalStates: WarningModalState;
  setWarningModalStates: React.Dispatch<
    React.SetStateAction<WarningModalState>
  >;
};

const PncForm: React.FC<PncFormProps> = ({
  form,
  formFields,
  formDraft,
  handleFormValuesChange,
  isServiceCompleted,
  supplementOptions,
  patientVaccinesInfo,
  tdVaccines,
  larcContraceptiveOptions,
  shortTermContraceptiveOptions,
  warningModalStates,
  notifyChangeInForm,
  setWarningModalStates,
  patientId,
}: any) => {
  const [activeKey, setActiveKey] = React.useState<string>("1");
  const [editMode, setEditMode] = React.useState(
    !isServiceCompleted || Object.keys(formDraft).length > 0
  );
  const navigate = useNavigate();

  const selectedPatientData = useSelector(
    (state: RootState) => state?.patientRecords.selectedPatientData
  );

const [postPncRecord, { isLoading: ispostPncLoading }] =
    usePostPncRecordMutation();
  const [updatePncRecord, { isLoading: isUpdatePncLoading }] =
    useUpdatePncRecordMutation();

  const showNotification = useGlobalNotification();

  const dispatch = useDispatch();

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
            (field: { name: string }) => field.name === firstErrorField
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
    } else if (isLastTab(activeKey, formFields)) {
      const completeFormValues = form.getFieldsValue(true);
      try {
        let response;
        if (isServiceCompleted) {
          const updatePayLoad = transformUpdateFormDataToPncApi(
            completeFormValues,
            patientId,
            selectedPatientData?.appointmentId,
            selectedPatientData?.age
          );

          const appointmentServiceId =
            selectedPatientData?.appointmentServices?.find(
              (s: any) => s.service?.name === ServiceType.PNC
            )?.id;

          if (!appointmentServiceId) {
            throw new Error("Appointment service ID not found.");
          }
          response = await updatePncRecord({
            appointment_service_id: appointmentServiceId,
            data: updatePayLoad,
          }).unwrap();
        } else {
          const payload = transformFormDataToPncApi(
            completeFormValues,
            patientId,
            selectedPatientData?.appointmentId,
            supplementOptions,
            larcContraceptiveOptions,
            shortTermContraceptiveOptions,
            patientVaccinesInfo,
            selectedPatientData?.age,
            tdVaccines,
          );
          response = await postPncRecord(payload).unwrap();
        }

        if (
          response.status === HttpStatus.OK ||
          response.status === HttpStatus.CREATED
        ) {
          showNotification(
            "success",
            isServiceCompleted
              ? "Pnc record updated successfully."
              : "Pnc record saved successfully."
          );

          // Update service status
          // const updatedAppointmentServices =
          //   selectedPatientData?.appointmentServices?.map((service) =>
          //     service.service?.name === ServiceType.PNC
          //       ? { ...service, status: SERVICES_STATUS.COMPLETED }
          //       : service
          //   ) || [];

          const existingPncService =
            selectedPatientData?.appointmentServices?.find(
              (s: any) => s.service?.name === ServiceType.PNC
            );

          const pncServiceSummary = {
            id: response.data?.appointmentService?.id ?? existingPncService?.id,
            status: SERVICES_STATUS.COMPLETED,
            service: {
              id: selectedPatientData?.selectedServiceIdFromCard,
              name: ServiceType.PNC,
            },
          };

          const existingServices =
            selectedPatientData?.appointmentServices || [];

          const updatedAppointmentServices = existingServices.some(
            (s: any) => s.service?.name === ServiceType.PNC
          )
            ? existingServices.map((s: any) =>
                s.service?.name === ServiceType.PNC
                  ? { ...s, ...pncServiceSummary }
                  : s
              )
            : [...existingServices, pncServiceSummary];

          dispatch(
            setSelectedPatientData({
              ...selectedPatientData,
              appointmentServices: updatedAppointmentServices,
              appointmentStatus: SERVICES_STATUS.COMPLETED,
            })
          );

          setEditMode(false);
          dispatch(
            clearFormData({
              formKey: `pncForm`,
              patientId,
            })
          );

          navigate(`/patient/${patientId}/services`);
        } else {
          const message = Array.isArray(response?.message)
            ? response.message.join(", ") // join all error messages into one string
            : response?.message || "Issue in submitting pnc record";
          showNotification("error", message);
        }
      } catch (error: any) {
        const message = Array.isArray(error?.data?.message)
          ? error.data.message.join(", ")
          : error?.data?.message ||
            error?.message ||
            "Issue in submitting pnc record";

        showNotification("error", "Pnc failed", message);
      } finally {
      }
    }
  };

  const tabItems = [
    {
      key: "1",
      label: "Vitals & Screenings",
      children: (
        <VitalsAndScreening
          formFields={filteredFormFields}
          editMode={editMode}
        />
      ),
      forceRender: true,
    },
    {
      key: "2",
      label: "Immunisation",
      children: (
        <Immunisation formFields={filteredFormFields} editMode={editMode} />
      ),
      forceRender: true,
    },

    {
      key: "3",
      label: "Breastfeeding",
      children: (
        <BreastFeeding
          isServiceCompleted={isServiceCompleted}
          formFields={filteredFormFields}
          editMode={editMode}
        />
      ),
      forceRender: true,
    },
    {
      key: "4",
      label: "Postpartum Nutrition",
      children: (
        <PostPartumNutrition
          formFields={filteredFormFields}
          editMode={editMode}
          formValues={notifyChangeInForm}
        />
      ),
      forceRender: true,
    },

    {
      key: "5",
      label: "Postpartum Family Planning",
      children: (
        <PostPartumFamilyPlanning
          formFields={filteredFormFields}
          editMode={editMode}
          formValues={notifyChangeInForm}
        />
      ),
      forceRender: true,
    },
  ];

  if (ispostPncLoading || isUpdatePncLoading) {
    <Loader />;
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
      <TopBar
        title="PNC"
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
                loading={isUpdatePncLoading || ispostPncLoading}
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

export default PncForm;
