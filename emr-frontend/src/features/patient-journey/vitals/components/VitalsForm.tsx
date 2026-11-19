import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Form, Tabs, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { debounce } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import TopBar from "@/components/ui/TopBar";
import WarningModal from "./WarningModal";
import Vitals from "./Vitals";
import GeneralScreening from "./GeneralScreening";
import { computeVitalsDerivedFields } from "../../data/moduleHelpers";
import { usePostVitalsRecordMutation } from "../../services/vitalServiceApi";
import { RootState } from "@/redux/store";
import { useGlobalNotification } from "@/hooks/useNotification";
import { clearFormData, setFormData } from "@/redux/store/slices/formDataSlice";
import { useNavigate } from "react-router-dom";
import {
  CmToInches,
  FeetToInches,
  InchesToFeetInches,
  isLastTab,
} from "@/utils/helpers/formHelperMethods";
import { VISIT_STATUS } from "../../data/constants";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import { ROUTES } from "@/data/routes";

type WarningModalState = {
  message: string[];
  visible: boolean;
};

type VitalsFormProps = {
  formFields: any[];
  setFormValueChange: (values: any, changedValues: any) => void;
  refetchVitalsData: () => void;
  refetchVaccines: () => void;
  previousVitalsRecord: any[];
  patientId: Number;
  formValues: any;
  warningModalStates: WarningModalState;
  setWarningModalStates: React.Dispatch<
    React.SetStateAction<WarningModalState>
  >;
};

const EMPTY_DRAFT: any = {};

const VitalsForm: React.FC<VitalsFormProps> = ({
  formFields,
  setFormValueChange,
  formValues,
  patientId,
  warningModalStates,
  setWarningModalStates,
  previousVitalsRecord,
  refetchVitalsData,
  refetchVaccines,
}: any) => {
  const [form] = Form.useForm();
  const [activeKey, setActiveKey] = useState<string>("1");
  const navigate = useNavigate();

  const savedDraft = useSelector(
    (state: RootState) =>
      state.formData?.[`vitalsForm_patient_${patientId}`] ?? EMPTY_DRAFT
  );
  const selectedPatientData = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData
  );
  const [editMode, setEditMode] = useState<boolean>(() => {
    const hasDraft = savedDraft && Object.keys(savedDraft).length > 0;
    if (hasDraft) {
      return true;
    }
    return !previousVitalsRecord;
  });

  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const dispatch = useDispatch();
  const showNotification = useGlobalNotification();
  const [postVitalsRecord, { isLoading: isPostingVitals }] =
    usePostVitalsRecordMutation();

  const appointmentId = useSelector(
    (state: RootState) =>
      state.patientRecords.selectedPatientData?.appointmentId
  );

  const debouncedDispatchRef = useRef(
    debounce((data: any, patientId: number) => {
      dispatch(
        setFormData({
          formKey: `vitalsForm`,
          data: data,
          patientId: patientId,
        })
      );
    }, 500)
  ).current;

  useEffect(() => {
    return () => {
      debouncedDispatchRef.cancel();
    };
  }, [debouncedDispatchRef]);

  const filteredFormFields = useMemo(() => {
    return formFields.map((tab: any) => ({
      ...tab,
      fields: (tab.fields || []).filter((field: any) => {
        if (!field.visibleIf) return true;
        if (typeof field.visibleIf !== "function") return true;
        return field.visibleIf(formValues);
      }),
    }));
  }, [formFields, formValues, isFormInitialized]);

  const tabItems = useMemo(
    () => [
      {
        key: "1",
        label: "Vitals",
        children: (
          <Vitals formFields={filteredFormFields} editMode={editMode} />
        ),
        forceRender: true,
      },
      {
        key: "2",
        label: "General Screening",
        children: (
          <GeneralScreening
            formFields={filteredFormFields}
            editMode={editMode}
            formValues={formValues}
          />
        ),
        forceRender: true,
      },
    ],
    [filteredFormFields, editMode]
  );

  const handleFormValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      setFormValueChange(allValues, changedValues);
      const derived = computeVitalsDerivedFields(
        {
          weight: allValues?.weight,
          height: allValues?.height,
          height_cm: allValues?.height_cm,
          body_mass_index: allValues?.body_mass_index,
          family_planning_user: allValues?.family_planning_user,
          family_planning_methods: allValues?.family_planning_methods,
        },
        selectedPatientData?.age
      );

      form.setFieldsValue(derived);

      debouncedDispatchRef(allValues, patientId);
    },
    [setFormValueChange, debouncedDispatchRef, patientId, form]
  );

  useEffect(() => {
    if (isFormInitialized) return;

    const baseValues = !editMode
      ? previousVitalsRecord || {}
      : formValues || {};

    if (!baseValues || Object.keys(baseValues).length === 0) return;

    const computedValues = {
      ...baseValues,
      ...computeVitalsDerivedFields(
        {
          weight: baseValues?.weight,
          height: baseValues?.height,
          height_cm: baseValues?.height_cm,
          body_mass_index: baseValues?.body_mass_index,
        },
        selectedPatientData?.age
      ),
      dob: selectedPatientData?.patientData?.dob,
      patientAge: selectedPatientData?.age,
    };

    form.setFieldsValue(computedValues);
    setIsFormInitialized(true);
  }, [
    editMode,
    previousVitalsRecord,
    formValues,
    isFormInitialized,
    form,
    selectedPatientData,
  ]);

  useEffect(() => {
    if (!isFormInitialized) return;
    if (!formValues) return;

    const hasVaccines =
      Array.isArray(formValues.immunization_records) &&
      formValues.immunization_records.length > 0;

    if (!hasVaccines && !formValues.dob) return;

    form.setFieldsValue({
      ...(formValues.dob && { dob: formValues.dob }),
      ...(hasVaccines && {
        immunization_records: formValues.immunization_records,
      }),
    });
  }, [
    isFormInitialized,
    formValues?.dob,
    formValues?.immunization_records,
    form,
  ]);

  /*************  ✨ Windsurf Command ⭐  *************/
  /**
 * Validate fields of the current tab
/*******  16e67a7f-5cc4-4a02-bf70-7be6240e33e0  *******/ const validateCurrentTabFields =
    async () => {
      const currentTab = formFields.find(
        (tab: any) => tab.tabKey === activeKey
      );
      if (!currentTab) return { isValid: true };

      const currentTabFieldNames = currentTab.fields?.map(
        (field: any) => field.name
      );

      try {
        await form.validateFields(currentTabFieldNames);
        return { isValid: true };
      } catch (errorInfo: any) {
        const firstErrorField = errorInfo.errorFields?.[0]?.name?.[0];

        if (firstErrorField) {
          form.scrollToField(firstErrorField);
        }

        return { isValid: false };
      }
    };

  const validateAllFields = async () => {
    try {
      await form.validateFields();
      return { isValid: true };
    } catch (errorInfo: any) {
      const firstErrorField = errorInfo.errorFields?.[0]?.name?.[0];

      if (firstErrorField) {
        const tabWithError = formFields.find((tab: any) =>
          tab.fields?.some(
            (field: { name: string }) => field.name === firstErrorField
          )
        );

        let errorTabKey = null;
        if (tabWithError) {
          errorTabKey = tabWithError.tabKey;
        }

        return {
          isValid: false,
          errorField: firstErrorField,
          errorTab: errorTabKey,
        };
      }
      return { isValid: false };
    }
  };

  const goToNextTab = async () => {
    const validation = await validateCurrentTabFields();
    if (!validation.isValid) {
      return;
    }

    const currentKeyNum = Number(activeKey);
    if (currentKeyNum < tabItems.length) {
      setActiveKey((currentKeyNum + 1).toString());
    }
  };

  const handleSubmit = async () => {
    const validation = await validateAllFields();

    if (!validation.isValid && validation.errorTab) {
      setActiveKey(validation.errorTab);
      return;
    }

    if (!validation.isValid) {
      return;
    }

    const completeFormValues = form.getFieldsValue(true);

    try {
      const {
        id,
        patientAge,
        maritalStatus,
        dob,
        immunization_records,
        ...formWithoutId
      } = completeFormValues;

      const newlyAdministeredVaccines =
        immunization_records
          ?.filter((record: any) => {
            const isChecked = record.immunization_status === true;
            const wasAlreadyAdministered =
              record.isAlreadyAdministered === true;
            return isChecked && !wasAlreadyAdministered;
          })
          ?.map((record: any) => ({
            vaccine_id: record.vaccine_id,
            dateAdministered: record.administration_date,
            status: "Administered",
          })) || [];

      const payLoad: any = {
        appointmentId,
        weight: Number(formWithoutId.weight),
        height:
            selectedPatientData?.age != null && Number(selectedPatientData.age) < 14
            ? CmToInches(formWithoutId.height_cm) // For kids: cm → inches
            : FeetToInches(formWithoutId.height),
        body_mass_index: formWithoutId.body_mass_index,
        pulse: formWithoutId.pulse,
        systolic_bp: formWithoutId.systolic_bp,
        diastolic_bp: formWithoutId.diastolic_bp,
        temperature: Number(formWithoutId.temperature),
        respiratory_rate: formWithoutId.respiratory_rate,
        spo2: Number(formWithoutId.spo2) || null,
        is_anemic: formWithoutId.is_anemic || false,
        is_dehydrated: formWithoutId.is_dehydrated || false,
        cough_gt_2_weeks: formWithoutId.cough_gt_2_weeks || false,
      };

      if (formWithoutId.is_dehydrated && formWithoutId.dehydration_level) {
        payLoad.dehydration_level = formWithoutId.dehydration_level;
      }

      if (formWithoutId.family_planning_user !== undefined) {
        payLoad.family_planning_user = formWithoutId.family_planning_user;
      }

      if (
        formWithoutId.family_planning_methods &&
        formWithoutId.family_planning_methods.length > 0
      ) {
        payLoad.family_planning_methods = formWithoutId.family_planning_methods;
      }

      if (newlyAdministeredVaccines.length > 0) {
        payLoad.immunisation = {
          doses: newlyAdministeredVaccines,
        };
      }

      const response = await postVitalsRecord(payLoad).unwrap();

      dispatch(
        setSelectedPatientData({
          ...selectedPatientData,
          vitals: {
            ...payLoad,
            height: InchesToFeetInches(payLoad.height),
          },
        })
      );

      if (response.success) {
        showNotification(
          "success",
          "Vitals Record",
          response?.message || "Vitals record submitted successfully"
        );

        await refetchVitalsData();
        await refetchVaccines();

        setEditMode(false);
        dispatch(
          clearFormData({
            formKey: `vitalsForm`,
            patientId: patientId,
          })
        );

        navigate(`${ROUTES.PATIENT_MODULE}/${patientId}/${ROUTES.SERVICES}`);
      } else {
        showNotification(
          "error",
          "Vitals Record",
          response?.message || "Issue in submitting current visit vitals record"
        );
      }
    } catch (error: any) {
      let errorMessage = error?.data?.message;
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage[0];
      }
      showNotification(
        "error",
        "Vitals Record",
        errorMessage || "Issue in submitting current visit vitals record"
      );
    }
  };

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
        title="Vitals and General Screening"
        showPatientInfo={true}
        patientInfo={{
          imageSrc: "https://via.placeholder.com/64",
          name: "Nadia Imran",
          mrNumber: "42501-4545665-1343",
          age: "26 years 7 months",
        }}
      />
      {previousVitalsRecord &&
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
        disabled={isPostingVitals}
      >
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          onChange={setActiveKey}
          items={tabItems}
        />
        {selectedPatientData?.visit?.status !== VISIT_STATUS.DISPATCHED && (
          <div style={{ textAlign: "right", marginTop: 24 }}>
            {!isLastTab(activeKey, formFields) ? (
              <Button type="primary" onClick={goToNextTab} loading={isPostingVitals}>
                Next
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleSubmit}
                disabled={!editMode}
                loading={isPostingVitals}
              >
                Save
              </Button>
            )}
          </div>
        )}
      </Form>
    </>
  );
};

export default VitalsForm;
