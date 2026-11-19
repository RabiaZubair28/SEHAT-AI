import { useState, useEffect, useCallback, useRef } from "react";
import { debounce } from "lodash";
import { useDynamicMedicines } from "../hooks/useDynamicMedicines";
import Loader from "@/components/shared/Loader";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { RootState } from "@/redux/store";
import { ServiceType } from "../data/constants";
import { isServiceCompleted } from "../utils/utilities";
import { useGetVisitServiceTypeByPatientQuery } from "../services/patientProfileApi";
import { createNutritionServiceFormFields } from "../data/nutritionServiceConstants";
import NutritionForm from "./components/NutritionForm";
import { Form } from "antd";
import {
  InchesToCm,
  InchesToFeetInches,
} from "@/utils/helpers/formHelperMethods";
import { transformNutritionApiToFormData } from "../utils/nutritionFormTransformers";
import { setFormData } from "@/redux/store/slices/formDataSlice";
import {
  checkFormWarningMessages,
  cleanupHiddenFields,
} from "../data/moduleHelpers";
import { getAgeInYears } from "@/utils/ageCalculator";

const EMPTY = {};

export default function Nutrition() {
  const [formFields, setFormFields] = useState<any[]>([]);
  const [notifyChangeInForm, setNotifyChangeInForm] = useState<any>();
  const [warningModalStates, setWarningModalStates] = useState<any>({
    message: [],
    visible: false,
  });

  const [form] = Form.useForm();
  const prevFormValuesRef = useRef<any>({});
  const { patientId } = useParams();
  const dispatch = useDispatch();

  const formDraft = useSelector(
    (state: RootState) =>
      state.formData?.[`nutritionForm_patient_${patientId}`] ?? EMPTY,
  );

  const selectedPatientData = useSelector(
    (state: RootState) => state?.patientRecords.selectedPatientData,
  );

  // Check whether service is completed (same as OPD)
  const serviceCompleted = isServiceCompleted(
    selectedPatientData?.appointmentServices,
    ServiceType.NUTRITION,
  );

  /** -------------------- API Calls ------------------------ */
  const {
    data: nutritionCurrentVisitRecord,
    isLoading: isNutritionCurrentVisitRecordLoading,
    refetch: refetchNutritionCurrentVisitRecord,
  } = useGetVisitServiceTypeByPatientQuery(
    {
      patientId: Number(patientId),
      visitId: selectedPatientData?.visit?.id,
      serviceType: ServiceType.NUTRITION,
    },
    {
      skip: !patientId || !selectedPatientData?.visit?.id || !serviceCompleted,
    },
  );

  useEffect(() => {
    if (serviceCompleted) {
      refetchNutritionCurrentVisitRecord();
    }
  }, [serviceCompleted, refetchNutritionCurrentVisitRecord]);

  // Supplement options
  const {
    supplementOptions,
    isLoading: isLoadingOptions,
    error: optionsError,
  } = useDynamicMedicines({
    skipMedicines: true,
    skipOtc: true,
    skipShortTermContraceptives: true,
    skipLarcContraceptives: true,
    skipCompleteContraceptives: true,
    skipCompleteStock: true,
  });

  /** -------------------- Form Fields ---------------------- */
  const medicineListReady = supplementOptions?.length;

  useEffect(() => {
    if (medicineListReady) {
      setFormFields(createNutritionServiceFormFields(supplementOptions));
    }
  }, [medicineListReady, supplementOptions]);

  /** -------------------- Helpers --------------------------- */

  const getNutritionVitals = (vitals: any) => ({
    weight: vitals?.weight != null ? Number(vitals?.weight) : undefined,
    height: InchesToFeetInches(vitals?.height),
    height_cm: vitals?.height_cm || InchesToCm(vitals?.height), //vitals?.height_cm,
    temperature: vitals?.temperature,
    pulse: vitals?.pulse,
    systolic_bp: vitals?.systolic_bp,
    diastolic_bp: vitals?.diastolic_bp,
    spo2: vitals?.spo2,
    respiratory_rate: vitals?.respiratory_rate,
    bmi: vitals?.body_mass_index,
  });

  const getPatientInfoForForm = () => {
    const patient = selectedPatientData?.patientData;

    return {
      age: getAgeInYears(patient?.dob),
      gender: patient?.gender,
      dob: patient?.dob,
      blood_group: patient?.additionalInfo?.blood_group,
    };
  };

  /** -------------------- Set Form Values ------------------- */

  const setNutritionFormValues = () => {
    let values: any = {};
    const hasDraft = Object.keys(formDraft).length > 0;
    const currentVisit = nutritionCurrentVisitRecord?.data?.nutrition;
    const patientInfo = getPatientInfoForForm();

    // Case 1: Service already completed & NO draft → load API visit data
    if (serviceCompleted && !hasDraft) {
      if (!currentVisit) return;
      const transformed = transformNutritionApiToFormData(currentVisit);
      values = {
        ...transformed,
        serviceCompleted,
      };
    }
    // Case 2: Service completed & has draft → load draft
    else if (serviceCompleted && hasDraft) {
      values = {
        serviceCompleted,
        ...formDraft,
      };
    } else if (!serviceCompleted) {
      if (hasDraft) {
        values = {
          ...cleanupHiddenFields(formFields, formDraft),
          ...getNutritionVitals(selectedPatientData?.vitals),
          ...formDraft,
        };
      } else {
        values = {
          ...getNutritionVitals(selectedPatientData?.vitals),
        };
      }
    } else {
      return;
    }

    values = {
      ...values,
      ...patientInfo,
      patientAge: selectedPatientData?.age,
    };

    form.setFieldsValue(values);
    setNotifyChangeInForm(values);

    // keep prevFormValuesRef in sync for first-time warnings, if needed
    prevFormValuesRef.current = values;
  };

  useEffect(() => {
    setNutritionFormValues();
  }, [
    nutritionCurrentVisitRecord?.data?.nutrition,
    selectedPatientData?.vitals,
    serviceCompleted,
    formFields.length,
    supplementOptions,
  ]);

  /** -------------------- Debounce Setup -------------------- */
  const debouncedDispatchRef = useRef<any>(
    debounce((data, pid) => {
      dispatch(
        setFormData({
          formKey: "nutritionForm",
          data,
          patientId: pid,
        }),
      );
    }, 1000),
  );

  const debouncedWarningRef = useRef<any>(
    debounce(
      (
        allValues: any,
        changedValues: any,
        previousValues: any,
        currentFormFields: any[],
      ) => {
        const message = checkFormWarningMessages({
          allValues,
          changedValues,
          previousValues,
          currentFormFields,
        });

        if (message) {
          setWarningModalStates({ visible: true, message });
        }
      },
      500,
    ),
  );

  const debouncedNotifyChangeInForm = useRef<any>(
    debounce((allValues) => {
      setNotifyChangeInForm(allValues);
    }, 500),
  );

  /** Cleanup debounces */
  useEffect(() => {
    return () => {
      debouncedDispatchRef.current.cancel();
      debouncedWarningRef.current.cancel();
      debouncedNotifyChangeInForm.current.cancel();
    };
  }, []);

  /** -------------------- Handle Form Change ---------------- */

  const handleFormValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      if (!Object.keys(changedValues).length) return;

      if (changedValues.height) {
        changedValues.height = allValues.height;
      }

      const patientInfo = getPatientInfoForForm();
      const cleanedValues = cleanupHiddenFields(formFields, {
        ...allValues,
        ...patientInfo,
        patientAge: selectedPatientData?.age,
      });
      const previousValues = prevFormValuesRef.current;

      const safeAllValues = {
        ...allValues,
        ...cleanedValues,
      };

      debouncedWarningRef.current(
        safeAllValues,
        changedValues,
        previousValues,
        formFields,
      );

      // Update local notifyChangeInForm state
      debouncedNotifyChangeInForm.current(safeAllValues);

      // Keep Antd form in sync
      form.setFieldsValue(safeAllValues);

      // Debounced Redux save
      debouncedDispatchRef.current(safeAllValues, Number(patientId));

      prevFormValuesRef.current = safeAllValues;
    },
    [
      form,
      patientId,
      supplementOptions,
      formFields,
      selectedPatientData, // for getPatientInfoForForm
    ],
  );

  /** -------------------- Loading UI ---------------- */

  if (isLoadingOptions) return <Loader />;
  if (optionsError) console.error("Supplement options error:", optionsError);
  if (isNutritionCurrentVisitRecordLoading) return <Loader />;

  return (
    <NutritionForm
      form={form}
      formFields={formFields}
      formDraft={formDraft}
      supplementOptions={supplementOptions}
      warningModalStates={warningModalStates}
      notifyChangeInForm={notifyChangeInForm}
      setWarningModalStates={setWarningModalStates}
      handleFormValuesChange={handleFormValuesChange}
      isServiceCompleted={serviceCompleted}
      patientId={Number(patientId)}
    />
  );
}
