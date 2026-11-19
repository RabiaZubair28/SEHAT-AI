import React, { useState, useEffect, useMemo } from "react";
import { Form, Tabs, Button, Space } from "antd";
import { EditOutlined } from "@ant-design/icons";
import PatientDetails from "@/features/patient-journey/patientProfile/components/PatientDetailsFields";
import SocialDetails from "@/features/patient-journey/patientProfile/components/SocialDetails";
import MedicalHistory from "@/features/patient-journey/patientProfile/components/MedicalHistoryFields";
import VisitHistory from "@/features/patient-journey/patientProfile/components/VisitHistoryFields";
import TopBar from "@/components/ui/TopBar";
import { useParams, useNavigate } from "react-router-dom";
import { ROUTES } from "@/data/routes";
import { useUpdatePatientMutation } from "@/features/patient-journey/services/patientProfileApi";
import Loader from "@/components/shared/Loader";
import { transformFormDataToApiFormat } from "@/features/patient-journey/utils/utilities";
import { formatPatientFormData } from "@/features/patient-journey/data/moduleHelpers";
import { Patient } from "@/data/types";
import { useGlobalNotification } from "@/hooks/useNotification";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import { RootState } from "@/redux/store";
import { calculateAgeByDob, getAgeInYears } from "@/utils/ageCalculator";
import { ApiErrorResponse } from "@/data/types";
import { findTabWithError } from "@/features/patient-journey/utils/utilities";
import { isLastTab } from "@/utils/helpers/formHelperMethods";
import { VISIT_STATUS } from "../../data/constants";
import QRModal from "@/components/shared/QRModal";
import { PatientFieldNames } from "../../data/patrientProfileconstants";

type PatientProfileFormProps = {
  setFormValueChange: (values: any) => void;
  formValues: any;
  patientData: any;
  setShowQRModal: React.Dispatch<React.SetStateAction<boolean>>;
  showQrModal: boolean;
  formFields: {
    tab: string;
    title: string;
    fields: any[];
  }[];
  isFrontDesk: boolean;
  isVaccinator: boolean;
};

const PatientProfileForm: React.FC<PatientProfileFormProps> = ({
  setFormValueChange,
  formValues,
  patientData,
  setShowQRModal,
  showQrModal,
  formFields,
  isFrontDesk,
  isVaccinator,
}: any) => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [form] = Form.useForm();
  const [activeKey, setActiveKey] = useState<string>("1");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFormInitialized, setIsFormInitialized] = useState<boolean>(false);
  const id = Number(patientId);
  const [updatePatient, { isLoading: isUpdating }] = useUpdatePatientMutation();
  const showNotification = useGlobalNotification();
  const dispatch = useDispatch();
  const selectedPatientData = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData,
  );

  const handleNext = () => {
    const index = formFields.findIndex((tab: any) => tab.tab === activeKey);
    const nextTab = formFields[index + 1];
    if (nextTab) {
      setActiveKey(nextTab.tab);
    }
  };

  const validateAllFields = async () => {
    try {
      const allFieldsToValidate = formFields.flatMap(
        (tab: any) =>
          tab.fields
            ?.filter(
              (field: { required?: boolean; rules?: any[] }) =>
                field.required || (field.rules && field.rules.length > 0),
            )
            ?.map((field: { name: any }) => field.name) || [],
      );

      await form.validateFields(allFieldsToValidate);
      return { isValid: true, errorTab: null };
    } catch (errorInfo: any) {
      const errorTab = findTabWithError(errorInfo.errorFields, formFields);
      return { isValid: false, errorTab };
    }
  };

  const handleSave = async () => {
    if (!isEditMode) {
      handleNext();
      return;
    }

    setIsSubmitting(true);
    try {
      const validation = await validateAllFields();

      if (!validation.isValid) {
        if (validation.errorTab) {
          setActiveKey(validation.errorTab);
        }
        showNotification("error", "Please fill in all required fields");
        return;
      }

      const formValues = form.getFieldsValue();
      const apiData = transformFormDataToApiFormat(formValues);

      const sanitizedData: Partial<Patient> = {
        ...apiData,
        dob: apiData.dob as string,
      };

      const response = await updatePatient({
        id: id,
        data: sanitizedData,
      });

      if (response.error) {
        const apiError = response.error as ApiErrorResponse;
        const message = Array.isArray(apiError?.data?.message)
          ? apiError.data.message.join(", ")
          : apiError?.data?.message || "Failed to update patient";

        showNotification("error", message);
        return;
      }

      const responseData = response.data;
      showNotification(
        "success",
        responseData?.message || "Patient Updated Successfully",
      );
      setIsEditMode(false);

      if (selectedPatientData) {
        let age = getAgeInYears(formValues?.dob);
        dispatch(
          setSelectedPatientData({
            ...selectedPatientData,
            age: age,
            patientData: {
              ...selectedPatientData.patientData,
              ...responseData,
            },
          }),
        );
      }

      const submitTabs =
        isFrontDesk || isVaccinator ? formFields : formFields.slice(0, -1);
      const isOnLastSubmitTab = isLastTab(activeKey, submitTabs);

      if (!isOnLastSubmitTab) {
        const currentTab = parseInt(activeKey, 10);
        const nextKey = (currentTab + 1).toString();
        setActiveKey(nextKey);
      }
    } catch (error) {
      console.error("Unexpected error updating patient:", error);
      showNotification("error", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedInitialData = useMemo(() => {
    if (patientData && !isFormInitialized) {
      return formatPatientFormData(patientData);
    }
    return null;
  }, [patientData, isFormInitialized]);

  useEffect(() => {
    if (formattedInitialData) {
      form.setFieldsValue(formattedInitialData);
      setIsFormInitialized(true);
    }
  }, [formattedInitialData, form]);

  const formattedChangeData = useMemo(() => {
    if (isFormInitialized && formValues && Object.keys(formValues).length > 0) {
      return formatPatientFormData(patientData, formValues);
    }
    return null;
  }, [isFormInitialized, formValues, patientData]);

  useEffect(() => {
    if (formattedChangeData) {
      form.setFieldsValue(formattedChangeData);
    }
  }, [formattedChangeData, form]);

  const tabItems = useMemo(() => {
    const getTabContent = (tabKey: string) => {
      const currentFields =
        formFields.find((tab: any) => tab.tab === tabKey)?.fields || [];

      switch (tabKey) {
        case "1":
          return (
            <PatientDetails
              fields={currentFields}
              editMode={isEditMode}
              formValues={patientData}
              form={form}
            />
          );
        case "2":
          return (
            <SocialDetails
              fields={currentFields}
              editMode={isEditMode}
              formValues={patientData}
            />
          );
        case "3":
          return (
            <MedicalHistory
              fields={currentFields}
              editMode={isEditMode}
              formValues={patientData}
            />
          );
        case "4":
          return <VisitHistory />;
        default:
          return null;
      }
    };

    return formFields.map((tab: any) => ({
      key: tab.tab,
      label: tab.title,
      children: getTabContent(tab.tab),
      forceRender: true,
    }));
  }, [formFields, isEditMode, patientData, formValues]);

  const renderActionButtons = () => {
    const submitTabs =
      isFrontDesk || isVaccinator ? formFields : formFields.slice(0, -1);

    const isOnSubmitTab = submitTabs.some((tab: any) => tab.tab === activeKey);
    if (!isOnSubmitTab) return null;

    if (!patientData || isUpdating) {
      return <Loader />;
    }

    return (
      <>
        <QRModal
          open={showQrModal}
          onClose={() => {
            setShowQRModal(false);
          }}
          onScanSuccess={(value) => {
            form.setFieldValue(PatientFieldNames.QR_Number, value);
          }}
        />
        {selectedPatientData?.visit?.status !== VISIT_STATUS.DISPATCHED && (
          <div className="flex justify-end mt-2">
            <Space>
              {!isLastTab(activeKey, submitTabs) ? (
                <Button
                  type="primary"
                  onClick={handleNext}
                  disabled={activeKey === "4"}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={handleSave}
                  disabled={!isEditMode}
                  loading={isSubmitting}
                >
                  Save
                </Button>
              )}
            </Space>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <TopBar
        title="Patient Dashboard"
        showIconButton
        onIconClick={() => navigate(ROUTES.SEARCH_PATIENT)}
        showPatientInfo={true}
      />
      {selectedPatientData?.visit?.status !== VISIT_STATUS.DISPATCHED && (
        <div className="flex justify-end mt-4 mb-0">
          <Button
            icon={<EditOutlined />}
            type="default"
            size="small"
            onClick={() => setIsEditMode((prev) => !prev)}
          >
            Edit
          </Button>
        </div>
      )}

      <Form
        className=""
        form={form}
        layout="vertical"
        onValuesChange={(changedValues) => {
          if (changedValues.dob) {
            const calculatedAge = calculateAgeByDob(changedValues.dob);

            form.setFieldsValue({ age: calculatedAge });
          }
          if (changedValues.division_id !== undefined) {
            form.setFieldsValue({
              district_id: undefined,
              taluka_id: undefined,
              uc_id: undefined,
            });
          }
          if (changedValues.nationalityStatus === "Non-Pakistani") {
            form.setFieldsValue({
              cnic_provider: undefined,
              cnic: undefined,
            });
          }
          if (changedValues.nationalityStatus === "Pakistani") {
            form.setFieldsValue({
              international_id: undefined,
            });
          }
          if (changedValues.district_id !== undefined) {
            form.setFieldsValue({
              taluka_id: undefined,
              uc_id: undefined,
            });
          }
          if (changedValues.taluka_id !== undefined) {
            form.setFieldsValue({
              uc_id: undefined,
            });
          }
          if (changedValues.cnic_provider === "CNIC Not Available") {
            form.setFieldsValue({
              cnic: undefined,
            });
          }
          form.setFieldsValue(changedValues);
          setFormValueChange(changedValues);
        }}
      >
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          onChange={setActiveKey}
          items={tabItems}
        />

        {renderActionButtons()}
      </Form>
    </>
  );
};

export default PatientProfileForm;
