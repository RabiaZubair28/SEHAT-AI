import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { createFamilyPlanningFormFields } from "../data/familyPlanningConstants";
import FamilyPlanningForm from "./components/FamilyPlanningForm";
import { isServiceCompleted } from "../utils/utilities";
import { ServiceType } from "../data/constants";
import { useDispatch, useSelector } from "react-redux";
import { Form } from "antd";
import { RootState } from "@/redux/store";
import { useDynamicMedicines } from "../hooks/useDynamicMedicines";
import Loader from "@/components/shared/Loader";
import { cleanupHiddenFields } from "../data/moduleHelpers";
import { useGetVisitServiceTypeByPatientQuery } from "../services/patientProfileApi";
import { debounce } from "lodash";
import { setFormData } from "@/redux/store/slices/formDataSlice";
import { transformFamilyPlanningApiToFormData } from "../utils/familyPlanningFormTransformers";

export default function FamilyPlanning() {
  ///-------------------- Initializations ------------------------ ///
  const [form] = Form.useForm();
  const [formFields, setFormFields] = useState<any[]>([]);
  const { patientId } = useParams();
  const [notifyChangeInForm, setNotifyChangeInForm] = useState<
    Record<string, any>
  >({});

  const dispatch = useDispatch();

  const formDraft = useSelector(
    (state: RootState) =>
      state.formData?.[`familyPlanning_patient_${patientId}`] ?? {},
  );

  const selectedPatientData = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData,
  );

  const serviceCompleted = useMemo(() => {
    return isServiceCompleted(
      selectedPatientData?.appointmentServices,
      ServiceType.FAMILY_PLANNING,
    );
  }, [selectedPatientData]);

  /** -------------------- API Calls ------------------------ */

  const {
    data: currentFamilyPlanningVisitRecord,
    isLoading: familyPlanningCurrentVisitRecordLoading,
    refetch: refetchCurrentFamilyPlanningByVisitId,
  } = useGetVisitServiceTypeByPatientQuery(
    {
      patientId: Number(patientId),
      visitId: selectedPatientData?.visit?.id,
      serviceType: ServiceType.FAMILY_PLANNING,
    },
    {
      skip: !patientId || !selectedPatientData?.visit?.id || !serviceCompleted,
    },
  );

  const {
    larcContraceptiveOptions,
    shortTermContraceptiveOptions,
    isLoading: isLoadingOptions,
    error: optionsError,
  } = useDynamicMedicines({
    skipSupplements: true,
    skipMedicines: true,
    skipOtc: true,
    skipCompleteContraceptives: true,
    skipCompleteStock: true,
  });

  let medicineListReady =
    larcContraceptiveOptions.length && shortTermContraceptiveOptions.length;

  /** -------------------- Setting Dynamic Form Fields ------------------------ */

  useEffect(() => {
    if (medicineListReady) {
      setFormFields(
        createFamilyPlanningFormFields(
          larcContraceptiveOptions,
          shortTermContraceptiveOptions,
          serviceCompleted,
        ),
      );
    }
  }, [
    medicineListReady,
    larcContraceptiveOptions,
    shortTermContraceptiveOptions,
  ]);

  const getPatientMartialStatus = () => {
    return selectedPatientData?.patientData?.additionalInfo?.marital_status;
  };

  //----refetch current visit record on serviceCompleted change----//
  useEffect(() => {
    if (serviceCompleted) {
      refetchCurrentFamilyPlanningByVisitId();
    }
  }, [serviceCompleted, refetchCurrentFamilyPlanningByVisitId]);

  /** -------------------- Set Form Values ------------------- */
  const setFamilyPlanningFormValues = useCallback(() => {
    let values: any = {};

    const hasDraft = Object.keys(formDraft).length > 0;
    const currentVisit = currentFamilyPlanningVisitRecord?.data?.familyPlanning;
    const transformed = transformFamilyPlanningApiToFormData(currentVisit);

    //Case 1: Service already completed & NO draft → load API visit data
    if (serviceCompleted && !hasDraft) {
      if (!currentVisit) return;

      values = {
        ...transformed,
        martialStatus: getPatientMartialStatus(),
      };
    } else if (serviceCompleted && hasDraft) {
      values = {
        ...formDraft,
        martialStatus: getPatientMartialStatus(),
      };
    }
    // Case 3: Service NOT completed & patient has vitals → new visit
    else if (!serviceCompleted) {
      values = {
        ...cleanupHiddenFields(formFields, formDraft),
        ...formDraft,
        martialStatus: getPatientMartialStatus(),
      };
    } else {
      return;
    }

    form.setFieldsValue(values);
    setNotifyChangeInForm(values);
  }, [
    currentFamilyPlanningVisitRecord?.data?.familyPlanning,
    serviceCompleted,
    formFields,
    selectedPatientData,
    form,
  ]);

  useEffect(() => {
    setFamilyPlanningFormValues();
  }, [
    selectedPatientData,
    currentFamilyPlanningVisitRecord,
    medicineListReady,
    formFields,
  ]);

  /** -------------------- Debounce Setup -------------------- */
  const debouncedDispatchRef = useRef<any>(
    debounce((data, pid) => {
      dispatch(
        setFormData({
          formKey: "familyPlanning",
          data,
          patientId: pid,
        }),
      );
    }, 500),
  );

  //-------------------- Handle Form Change ---------------- */
  const handleFormValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      if (!Object.keys(changedValues).length) return;

      let cleanedValues = cleanupHiddenFields(
        formFields,
        { ...allValues, martialStatus: getPatientMartialStatus() },
        form,
      );
      let updatedValues = {
        ...cleanedValues,
      };
      form.setFieldsValue(updatedValues);
      setNotifyChangeInForm(updatedValues);
      debouncedDispatchRef.current(updatedValues, Number(patientId));
    },
    [form, patientId, formFields],
  );

  /** Cleanup debounces */
  useEffect(() => {
    return () => {
      debouncedDispatchRef.current.cancel();
    };
  }, []);

  ///-------------------- UI Loading (AFTER all hooks) ------------------------ ///

  // ✅ FIXED: Conditional return AFTER all hooks
  if (
    isLoadingOptions ||
    !medicineListReady ||
    familyPlanningCurrentVisitRecordLoading
  ) {
    return <Loader />;
  }

  if (optionsError) {
    console.error("Error loading medicine options:", optionsError);
  }

  return (
    <FamilyPlanningForm
      form={form}
      handleFormValuesChange={handleFormValuesChange}
      formDraft={formDraft}
      selectedPatientData={selectedPatientData}
      notifyChangeInForm={notifyChangeInForm}
      larcContraceptiveOptions={larcContraceptiveOptions}
      shortTermContraceptiveOptions={shortTermContraceptiveOptions}
      isServiceCompleted={serviceCompleted}
      formFields={formFields}
      patientId={Number(patientId)}
    />
  );
}
