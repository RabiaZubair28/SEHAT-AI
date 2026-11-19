import React, { useMemo } from "react";
import { Form, Tabs, Button } from "antd";
import TopBar from "@/components/ui/TopBar";
import MedicalHistory from "@/features/patient-journey/anc/components/MedicalHistory";
import PregnancyInfo from "@/features/patient-journey/anc/components/PregnancyInfo";
import Immunisation from "@/features/patient-journey/anc/components/Immunisation";
import UtlraSoundAndCTG from "@/features/patient-journey/anc/components/UtlraSoundAndCTG";
import VitalsAndScreenings from "@/features/patient-journey/anc/components/VitalsAndScreening";
import DignosisAndPrescreption from "@/features/patient-journey/anc/components/DignosisAndPrescreption";
import WarningModal from "@/components/shared/WarningModal";
import { EditOutlined } from "@ant-design/icons";
import {
  usePostAncRecordMutation,
  useUpdateAncRecordMutation,
} from "../../services/ancServiceApi";
import { useGlobalNotification } from "@/hooks/useNotification";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  transformFormDataToAncApi,
  transformFormUpdateDataToAncApi,
} from "../../utils/ancFormTransformers";
import { clearFormData } from "@/redux/store/slices/formDataSlice";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import { useNavigate } from "react-router-dom";

import { HttpStatus } from "@/data/types";
import {
  SERVICES_STATUS,
  ServiceType,
  VISIT_STATUS,
} from "../../data/constants";
import { isLastTab } from "@/utils/helpers/formHelperMethods";
import Loader from "@/components/shared/Loader";

type WarningModalState = {
  message: string[];
  visible: boolean;
};

type AncFormProps = {
  form: any;
  formFields: any[];
  handleFormValuesChange: (values: any, changedValues: any) => void;
  patientId: Number;
  formDraft: any;
  notifyChangeInForm: any;
  medicineOptions: any[];
  supplementOptions: any[];
  isServiceCompleted: boolean;
  patientVaccinesInfo: any[];
  tdVaccines: any[];
  warningModalStates: WarningModalState;
  setWarningModalStates: React.Dispatch<
    React.SetStateAction<WarningModalState>
  >;
};

const AncForm: React.FC<AncFormProps> = ({
  form,
  formFields,
  formDraft,
  handleFormValuesChange,
  medicineOptions,
  supplementOptions,
  patientVaccinesInfo,
  tdVaccines,
  isServiceCompleted,
  warningModalStates,
  notifyChangeInForm,
  setWarningModalStates,
  patientId,
}: any) => {
  //current Selected patient for service record
  const selectedPatientData = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData,
  );
  const [activeKey, setActiveKey] = React.useState<string>("1");
  const [editMode, setEditMode] = React.useState(
    !isServiceCompleted || Object.keys(formDraft).length > 0,
  );

  //RTK Services
  const [postAncRecord, { isLoading: isPostLoading }] =
    usePostAncRecordMutation();
  const [updateAncRecord, { isLoading: isUpdateLoading }] =
    useUpdateAncRecordMutation();

  const showNotification = useGlobalNotification();

  //naviation
  const navigate = useNavigate();
  const dispatch = useDispatch();

  //Form saving Selectors//

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

  // Helper function to collect field names from a field configuration
  const collectFieldNames = (field: any, values: any): any[] => {
    const fieldNames: any[] = [];

    // Handle table type fields
    if (field.type === "table") {
      const tableName = field.name;
      const tableData = values[tableName] || [];

      // Get the group fields for this table
      const groupFields =
        typeof field.getGroupFields === "function"
          ? field.getGroupFields()
          : [];

      // For each row in the table
      tableData.forEach((_: any, rowIndex: number) => {
        groupFields.forEach((groupField: any) => {
          // Check if this field should be visible
          const shouldInclude =
            !groupField.visibleIf || groupField.visibleIf(values, rowIndex);

          if (shouldInclude && groupField.name) {
            fieldNames.push([tableName, rowIndex, groupField.name]);
          }
        });
      });
    }
    // Handle formList type fields
    else if (field.type === "formList") {
      const listName = field.name;
      const listData = values[listName] || [];

      listData.forEach((_: any, listIndex: number) => {
        (field.fields || []).forEach((childField: any) => {
          // Check if this field should be visible
          const shouldInclude =
            !childField.visibleIf || childField.visibleIf(values, listIndex);

          if (shouldInclude && childField.name) {
            fieldNames.push([listName, listIndex, childField.name]);
          }
        });
      });
    }
    // Handle regular fields
    else if (field.name) {
      // Check if this field should be visible
      const shouldInclude = !field.visibleIf || field.visibleIf(values);

      if (shouldInclude) {
        fieldNames.push(field.name);
      }
    }

    return fieldNames;
  };

  const validateAllFields = async () => {
    try {
      const allValues = form.getFieldsValue(true);
      const allFieldNames: any[] = [];

      // Collect all field names from all tabs
      formFields.forEach((tab: any) => {
        (tab.fields || []).forEach((field: any) => {
          const names = collectFieldNames(field, allValues);
          allFieldNames.push(...names);
        });
      });

      // Validate all collected fields
      await form.validateFields(allFieldNames);

      return { isValid: true };
    } catch (errorInfo: any) {
      console.log("Validation errors:", errorInfo);

      const firstErrorField = errorInfo.errorFields?.[0]?.name;

      if (firstErrorField) {
        // Find which tab contains this error
        // firstErrorField could be a string or an array like ['previousPregnancies', 0, 'place_of_delivery']
        const fieldKey = Array.isArray(firstErrorField)
          ? firstErrorField[0]
          : firstErrorField;

        const tabWithError = formFields.find((tab: any) =>
          tab.fields?.some((field: any) => {
            // Check regular fields
            if (field.name === fieldKey) return true;

            // Check table fields
            if (field.type === "table" && field.name === fieldKey) return true;

            // Check formList fields
            if (field.type === "formList" && field.name === fieldKey)
              return true;

            return false;
          }),
        );

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

    // Collect all field names for the current tab
    const fieldNames: any[] = [];

    (currentTab?.fields || []).forEach((field: any) => {
      const names = collectFieldNames(field, values);
      fieldNames.push(...names);
    });

    try {
      await form.validateFields(fieldNames);
      return { isValid: true };
    } catch (error: any) {
      console.log("Current tab validation errors:", error);
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
    const validation = await validateAllFields();

    if (!validation.isValid && validation.errorTab) {
      setActiveKey(validation.errorTab);
    } else if (isLastTab(activeKey, formFields)) {
      const completeFormValues = form.getFieldsValue(true);

      try {
        let response;

        if (isServiceCompleted) {
          const payload = transformFormUpdateDataToAncApi(
            completeFormValues,
            patientId,
            selectedPatientData?.appointmentId,
            selectedPatientData?.age,
          );

          const appointmentServiceId =
            selectedPatientData?.appointmentServices?.find(
              (s: any) => s.service?.name === ServiceType.ANC,
            )?.id;

          // let appointmentServiceId =
          //   selectedPatientData?.appointmentServices?.[0]?.id || undefined;

          if (!appointmentServiceId) {
            console.error("appointment service id does not exist");
            return;
          }
          // 🔁 Use PATCH if ANC record already exists
          response = await updateAncRecord({
            id: appointmentServiceId,
            data: payload,
          }).unwrap();
        } else {
          const payload = transformFormDataToAncApi(
            completeFormValues,
            patientId,
            selectedPatientData?.appointmentId,
            medicineOptions,
            supplementOptions,
            patientVaccinesInfo,
            selectedPatientData?.age,
            tdVaccines,
          );

          response = await postAncRecord(payload).unwrap();
        }

        if (
          response?.status === HttpStatus.OK ||
          response?.status === HttpStatus.CREATED
        ) {
          showNotification(
            "success",
            "ANC Visit Record",
            response?.message ||
              (isServiceCompleted
                ? "Anc record updated successfully"
                : "Anc visit record submitted successfully"),
          );

          const existingAncService =
            selectedPatientData?.appointmentServices?.find(
              (s: any) => s.service?.name === ServiceType.ANC,
            );

          const ancServiceSummary = {
            id: response.data?.appointmentService.id ?? existingAncService?.id,
            status: SERVICES_STATUS.COMPLETED,
            service: {
              id: selectedPatientData?.selectedServiceIdFromCard,
              name: ServiceType.ANC,
            },
          };

          const existingServices =
            selectedPatientData?.appointmentServices || [];

          const updatedAppointmentServices = existingServices.some(
            (s: any) => s.service?.name === ServiceType.ANC,
          )
            ? existingServices.map((s: any) =>
                s.service?.name === ServiceType.ANC
                  ? { ...s, ...ancServiceSummary }
                  : s,
              )
            : [...existingServices, ancServiceSummary];

          dispatch(
            setSelectedPatientData({
              ...selectedPatientData,
              appointmentServices: updatedAppointmentServices,
              appointmentStatus: SERVICES_STATUS.COMPLETED,
            }),
          );
          setEditMode(false);
          dispatch(clearFormData({ formKey: "ancForm", patientId: patientId }));
          navigate(`/patient/${patientId}/services`);
          // handleCompleteANCService();
        } else {
          const message = Array.isArray(response?.message)
            ? response.message.join(", ") // join all error messages into one string
            : response?.message ||
              "Issue in submitting current visit ANC record";
          showNotification("error", "ANC Visit Record", message);
        }
      } catch (error: any) {
        const message = Array.isArray(error?.data?.message)
          ? error.data.message.join(", ")
          : error?.data?.message ||
            error?.message ||
            "Issue in submitting current visit ANC record";

        showNotification("error", "ANC Visit Record", message);
      }
    }
  };

  const tabItems = [
    {
      key: "1",
      label: "Pregnancy Info",
      children: (
        <PregnancyInfo
          formFields={filteredFormFields}
          editMode={editMode}
          form={form}
          formValues={notifyChangeInForm}
        />
      ),
    },
    {
      key: "2",
      label: "Medical & Surgical History",
      children: (
        <MedicalHistory formFields={filteredFormFields} editMode={editMode} />
      ),
      forceRender: true,
    },
    {
      key: "3",
      label: "Vitals & Screenings",
      children: (
        <VitalsAndScreenings
          formFields={filteredFormFields}
          editMode={editMode}
        />
      ),
      forceRender: true,
    },
    {
      key: "4",
      label: "Ultrasound & CTG",
      children: (
        <UtlraSoundAndCTG formFields={filteredFormFields} editMode={editMode} />
      ),
      forceRender: true,
    },
    {
      key: "5",
      label: "Diagnosis & Prescription",
      children: (
        <DignosisAndPrescreption
          formFields={filteredFormFields}
          editMode={editMode}
          formValues={notifyChangeInForm}
        />
      ),
      forceRender: true,
    },
    {
      key: "6",
      label: "Immunisation",
      children: (
        <Immunisation formFields={filteredFormFields} editMode={editMode} />
      ),
      forceRender: true,
    },
  ];

  if (isPostLoading || isUpdateLoading) {
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
      <TopBar
        title="ANC"
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
          defaultActiveKey="4"
          activeKey={activeKey}
          onChange={setActiveKey}
          destroyOnHidden={!editMode}
          items={tabItems}
        />
        {selectedPatientData?.visit?.status !== VISIT_STATUS.DISPATCHED &&
          (!isLastTab(activeKey, formFields) ? (
            <div style={{ textAlign: "right", marginTop: 24 }}>
              <Button type="primary" onClick={goToNextTab}>
                Next
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: "right", marginTop: 24 }}>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={isPostLoading || isUpdateLoading}
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

export default AncForm;
