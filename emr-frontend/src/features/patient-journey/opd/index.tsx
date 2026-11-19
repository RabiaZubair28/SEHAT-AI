import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createOPDFormFields } from "../data/opdServiceConstants";
import OpdForm from "./components/OpdForm";
import { useDynamicMedicines } from "../hooks/useDynamicMedicines";
import Loader from "@/components/shared/Loader";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useParams } from "react-router-dom";
import {
  PatientsOpdFinalDiagnosis,
  SERVICES_STATUS,
  ServiceType,
  WARNING_POP_UP_TIME,
} from "../data/constants";
import { isServiceCompleted } from "../utils/utilities";
import {
  useGetPreviousVisitByIdQuery,
  useGetVisitServiceTypeByPatientQuery,
} from "../services/patientProfileApi";
import { Form } from "antd";
import {
  InchesToCm,
  InchesToFeetInches,
} from "@/utils/helpers/formHelperMethods";
import { transformOpdApiToFormData } from "../utils/opdFormTransformers";
import { debounce } from "lodash";
import { setFormData } from "@/redux/store/slices/formDataSlice";
import {
  checkFormWarningMessages,
  cleanupHiddenFields,
  getVariantIdMedicine,
  mapPrescriptionsToFormValues,
  opdAutoCalculateValues,
} from "../data/moduleHelpers";
import { setFollowUpDecision } from "@/redux/store/slices/followUpRedux";
import { getAgeInYears } from "@/utils/ageCalculator";
import { useGetPrescriptionsQuery } from "@/services/medicineApi";

export default function Opd() {
  const [formFields, setFormFields] = useState<any[]>([]);
  const [notifyChangeInForm, setNotifyChangeInForm] = useState<any>();
  const [warningModalStates, setWarningModalStates] = useState<any>({
    message: [],
    visible: false,
  });

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [form] = Form.useForm();
  const prevFormValuesRef = useRef<any>({});
  const { patientId } = useParams();
  const dispatch = useDispatch();

  const formDraft = useSelector(
    (state: RootState) =>
      state.formData?.[`opdForm_patient_${patientId}`] ?? {},
  );
  const selectedPatientData = useSelector(
    (state: RootState) => state?.patientRecords.selectedPatientData,
  );

  const decision = useSelector(
    (state: RootState) => state.followUpDecision[patientId!],
  );

  const serviceCompleted = isServiceCompleted(
    selectedPatientData?.appointmentServices,
    ServiceType.OPD,
  );

  /** ----------------------------------------------------
   *  RTK QUERIES
   * --------------------------------------------------- */

  const {
    data: currentOpdVisitRecord,
    isLoading: opdVisitsRecordLoading,
    refetch: refetchOpdByCurrentVisitId,
  } = useGetVisitServiceTypeByPatientQuery(
    {
      patientId: Number(patientId),
      visitId: selectedPatientData?.visit?.id,
      // visitId: Number(visitId),
      serviceType: ServiceType.OPD, // or "PNC", etc.
    },
    {
      skip: !patientId || !selectedPatientData?.visit?.id || !serviceCompleted, // ✅ skip query when IDs not available
    },
  );

  const {
    data: previousOpdVisitsAllRecords,
    isLoading: previousOpdVisitsLoading,
    refetch: refetchPreviousVisitOpdData,
  } = useGetPreviousVisitByIdQuery(
    {
      id: Number(patientId),
      serviceType: ServiceType.OPD,
    },
    {
      skip: !patientId,
    },
  );

  const { data: prescriptionResponse } = useGetPrescriptionsQuery(
    { patient_id: Number(patientId) },
    { skip: !patientId },
  );

  /** ----------------------------------------------------
   *  RTK QUERIES
   * --------------------------------------------------- */

  const {
    completeStockMedicinesOptionsWithOther: medicineOptions,
    stockMedicinePaginationProps,
    isLoading: isLoadingOptions,
    error: optionsError,
  } = useDynamicMedicines({
    skipSupplements: true,
    skipMedicines: true,
    skipOtc: true,
    skipShortTermContraceptives: true,
    skipLarcContraceptives: true,
    skipCompleteContraceptives: true,
  });

  useEffect(() => {
    if (serviceCompleted) {
      refetchOpdByCurrentVisitId();
    }
    refetchPreviousVisitOpdData();
  }, [patientId, selectedPatientData?.visit?.id, serviceCompleted]);

  /** ----------------------------------------------------
   *  SET FORM FIELDS
   * --------------------------------------------------- */
  const medicineListReady = medicineOptions?.length;

  useEffect(() => {
    if (!medicineListReady) return;
    setFormFields(
      createOPDFormFields(
        medicineOptions,
        serviceCompleted,
        stockMedicinePaginationProps,
      ),
    );
  }, [medicineListReady]);

  /** ----------------------------------------------------
   * Get the last completed OPD visit
   * --------------------------------------------------- */
  const getLastCompletedOpdVisit = (opdRecord: any) => {
    // If it's not an array, immediately return null.
    if (!Array.isArray(opdRecord?.data?.opd)) {
      return null;
    }

    // Find first completed entry (API sends newest -> oldest)
    const completed = opdRecord?.data?.opd.find(
      (item: any) => item?.status === SERVICES_STATUS.COMPLETED,
    );

    return completed || null;
  };

  /** ----------------------------------------------------
   * Get opd record by appointmentId
   * --------------------------------------------------- */
  const getOpdRecordByAppointmentId = () => {
    if (!Array.isArray(currentOpdVisitRecord?.data?.opd)) {
      return null; // no records
    }

    // Find the OPD record that matches the appointmentId
    const opdRecord = currentOpdVisitRecord?.data?.opd.find(
      (item: any) =>
        item?.appointment?.id === selectedPatientData?.appointmentId,
    );

    return opdRecord || null; // return null if not found
  };

  const patientRequiresFollowUp = () => {
    if (!Array.isArray(previousOpdVisitsAllRecords?.data?.opd)) {
      return null;
    }
    // Find first completed entry (API sends newest -> oldest)
    const lastCompletedOpd = previousOpdVisitsAllRecords?.data?.opd.find(
      (item: any) => item?.status === SERVICES_STATUS.COMPLETED,
    );
    return (
      lastCompletedOpd?.opdDiagnosis?.patientFinalDiagnosis ===
      PatientsOpdFinalDiagnosis.FOLLOW_UP_REQUIRED
    );
  };

  const getPatientsLastVisitWeight = (opdRecord: any) => {
    let lastCompletedOpd = getLastCompletedOpdVisit(opdRecord);
    if (lastCompletedOpd?.opdVitals?.weight)
      return lastCompletedOpd?.opdVitals?.weight;
  };

  const getPatientGender = () => {
    return selectedPatientData?.patientData?.gender;
  };

  const getPatientAge = () => {
    const patient = selectedPatientData?.patientData;
    return getAgeInYears(patient?.dob);
  };

  /** ----------------------------------------------------
   *  SHOW MODAL ON FOLLOW UP:
   * --------------------------------------------------- */

  useEffect(() => {
    if (
      !decision &&
      !serviceCompleted &&
      !!getLastCompletedOpdVisit(previousOpdVisitsAllRecords) &&
      patientRequiresFollowUp()
    ) {
      setShowFollowUpModal(true);
    }
  }, [
    currentOpdVisitRecord?.data?.opd,
    previousOpdVisitsAllRecords?.data?.opd,
  ]);

  const getOpdVitals = (opd: any) => {
    const adultHeight =
      opd?.height && typeof opd.height === "object"
        ? opd.height
        : InchesToFeetInches(opd?.height);

    return {
      weight: Number(opd?.weight),
      height: adultHeight,
      height_cm: opd?.height_cm || InchesToCm(opd?.height),
      temperature: opd?.temperature,
      pulse: opd?.pulse,
      systolic_bp: opd?.systolic_bp,
      diastolic_bp: opd?.diastolic_bp,
      spo2: opd?.spo2,
      respiratory_rate: opd?.respiratory_rate,
      change_in_weight: opd?.change_in_weight || 0,
      body_mass_index: opd?.body_mass_index,
      blood_group:
        selectedPatientData?.patientData?.additionalInfo?.blood_group,
      last_weight: getPatientsLastVisitWeight(previousOpdVisitsAllRecords),
      gender: getPatientGender(),
      age: getPatientAge(),
    };
  };

  const setOpdFormValues = () => {
    let values: any = {};

    const hasDraft = Object.keys(formDraft).length > 0;

    let prescribedMedicines = mapPrescriptionsToFormValues(
      prescriptionResponse?.data || [],
    );

    //Case 1: Service already completed & NO draft → load API visit data
    if (serviceCompleted && !hasDraft) {
      const currentVisit = getOpdRecordByAppointmentId();

      if (!currentVisit) return;

      const transformed = transformOpdApiToFormData(currentVisit);
      values = {
        ...transformed,
        ...getOpdVitals(transformed),
        serviceCompleted,
        gender: getPatientGender(),
        age: getPatientAge(),
      };
    }

    //Case 2: Service completed & draft exists → load draft
    else if (serviceCompleted && hasDraft) {
      values = {
        serviceCompleted,
        ...formDraft,
        gender: getPatientGender(),
        age: getPatientAge(),
      };
    } else if (!serviceCompleted && !hasDraft && decision === "follow_up") {
      const lastVisitData = getLastCompletedOpdVisit(
        previousOpdVisitsAllRecords,
      );

      const transformed = transformOpdApiToFormData(lastVisitData);

      values = {
        ...transformed,
        ...getOpdVitals(transformed),
        serviceCompleted,
        gender: getPatientGender(),
        age: getPatientAge(),
      };
    }
    // Case 3: Service NOT completed & patient has vitals → new visit
    else if (!serviceCompleted && !hasDraft && decision !== "follow_up") {
      values = {
        ...cleanupHiddenFields(formFields, formDraft),
        ...getOpdVitals(selectedPatientData?.vitals),
        gender: getPatientGender(),
        age: getPatientAge(),
      };
    } else if (!serviceCompleted && hasDraft) {
      const updated = getOpdVitals(selectedPatientData?.vitals);

      values = {
        ...opdAutoCalculateValues(
          { ...updated, ...formDraft },
          selectedPatientData?.age,
        ),
        ...cleanupHiddenFields(formFields, updated),
        gender: getPatientGender(),
        age: getPatientAge(),
      };
    } else {
      return;
    }

    // Apply values to form

    form.setFieldsValue({
      ...values,
      ...prescribedMedicines,
    });

    //Notify parent
    setNotifyChangeInForm({
      ...values,
      ...prescribedMedicines,
    });
  };

  useEffect(() => {
    setOpdFormValues();
  }, [
    currentOpdVisitRecord?.data?.opd,
    previousOpdVisitsAllRecords?.data?.opd,
    selectedPatientData?.vitals,
    serviceCompleted,
    prescriptionResponse?.data,
    showFollowUpModal,
  ]);

  /** ----------------------------------------------------
   *  DEBOUNCED FUNCTIONS
   * --------------------------------------------------- */

  const debouncedDispatchRef = useRef<any>(null);

  if (!debouncedDispatchRef.current) {
    debouncedDispatchRef.current = debounce((data, pid) => {
      dispatch(
        setFormData({
          formKey: "opdForm",
          data,
          patientId: pid,
        }),
      );
    }, 500);
  }

  // Warning debounce - INCREASED TO 1500ms
  const debouncedWarning = useMemo(
    () =>
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
            setWarningModalStates({
              visible: true,
              message,
            });
          }
        },
        WARNING_POP_UP_TIME, // Changed from 500 to 1500
      ),
    [],
  );

  // Warning debounce
  const debouncedNotifyChangeInForm = useRef<any>(null);
  if (!debouncedNotifyChangeInForm.current) {
    debouncedNotifyChangeInForm.current = debounce((allValues) => {
      setNotifyChangeInForm(allValues);
    }, 500);
  }

  useEffect(() => {
    return () => {
      debouncedDispatchRef.current?.cancel?.();
      debouncedNotifyChangeInForm.current.cancel?.();
    };
  }, []);

  /** ----------------------------------------------------
   * HANDLE FORM VALUE CHANGE
   * --------------------------------------------------- */

  const handleFormValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      if (!Object.keys(changedValues).length) return;

      if (changedValues.height) {
        changedValues.height = allValues.height;
        // If height changed, trigger validation
        form.validateFields(["height", "feet"]);
      }

      const newFormValues: any = {};

      const updatedMedicine = allValues?.medicine?.map(
        (med: any, idx: number) => {
          const prev = prevFormValuesRef.current?.medicine?.[idx] || {};

          const changed = changedValues.medicine?.[idx] || {};

          // Skip rows untouched in this change event
          if (!changed || Object.keys(changed).length === 0) return med;

          // Reset if medicineName actually changed
          if (
            changed.medicineName !== undefined &&
            changed.medicineName !== prev?.medicineName
          ) {
            return {
              ...med,
              medicineName: changed.medicineName,
              strength: undefined,
              formOfMedicine: undefined,
              other_medicine: undefined,
              variant_id: undefined,
            };
          }

          // Reset formOfMedicine if strength changed
          if (
            changed.strength !== undefined &&
            changed.strength !== prev?.strength
          ) {
            return {
              ...med,
              strength: changed.strength,
              formOfMedicine: undefined,
              variant_id: undefined,
            };
          }

          // Capture the variant when the final cascading field changes.
          if (
            changed.formOfMedicine !== undefined &&
            changed.formOfMedicine !== prev?.formOfMedicine
          ) {
            return {
              ...med,
              variant_id:
                getVariantIdMedicine(
                  med.medicineName,
                  med.formOfMedicine,
                  medicineOptions,
                  med.strength,
                ) ?? undefined,
            };
          }

          return med;
        },
      );

      // Only update form if anything really changed
      const isDifferent = updatedMedicine?.some((m: any, i: any) => {
        const prev = prevFormValuesRef.current?.medicine?.[i] || {};
        return (
          (m?.medicineName || "") !== (prev?.medicineName || "") ||
          (m?.strength || "") !== (prev?.strength || "") ||
          (m?.formOfMedicine || "") !== (prev?.formOfMedicine || "") ||
          (m?.other_medicine || "") !== (prev?.other_medicine || "") ||
          (m?.variant_id || "") !== (prev?.variant_id || "")
        );
      });

      if (isDifferent) {
        newFormValues.medicine = updatedMedicine;
      }

      // Auto calculation values
      const safeAllValues = {
        ...cleanupHiddenFields(
          formFields,
          {
            ...allValues,
            last_weight: getPatientsLastVisitWeight(
              previousOpdVisitsAllRecords,
            ),
            gender: getPatientGender(),
            age: getPatientAge(),
          },
          form,
        ),
      };

      const autoValues = opdAutoCalculateValues(safeAllValues, getPatientAge());

      // Merge autoValues only if they differ
      Object.keys(autoValues).forEach((key) => {
        if (safeAllValues[key] !== autoValues[key]) {
          newFormValues[key] = autoValues[key];
        }
      });

      // Only call setFieldsValue once, with the merged differences
      if (Object.keys(newFormValues).length > 0) {
        form.setFieldsValue(newFormValues);
      }

      // Debounced Redux save
      const previousValues = prevFormValuesRef.current;
      const mergedValues = {
        ...safeAllValues,
        ...autoValues,
        ...newFormValues,
      };
      debouncedDispatchRef.current(mergedValues, Number(patientId));
      form.setFieldsValue(mergedValues);
      debouncedNotifyChangeInForm.current(mergedValues);
      debouncedWarning(mergedValues, changedValues, previousValues, formFields);

      prevFormValuesRef.current = mergedValues;
    },
    [checkFormWarningMessages, form, patientId, medicineOptions, formFields],
  );

  /** ----------------------------------------------------
   *  LOAD UI
   * --------------------------------------------------- */
  if (opdVisitsRecordLoading || isLoadingOptions || previousOpdVisitsLoading) {
    return <Loader />;
  }

  if (optionsError) {
    console.error("Error loading medicine/supplement options:", optionsError);
  }

  const handleNewVisit = () => {
    if (!patientId) return;
    setShowFollowUpModal(false);
    dispatch(
      setFollowUpDecision({
        patientId,
        decision: "new_visit",
      }),
    );
    // setOpdFormValues();
  };

  const handleFollowUp = () => {
    if (!patientId) return;
    dispatch(
      setFollowUpDecision({
        patientId,
        decision: "follow_up",
      }),
    );

    setShowFollowUpModal(false);
    // pre-fill form with last visit data for follow up
  };

  const handleCloseModal = () => {
    setShowFollowUpModal(false);
  };

  return (
    <OpdForm
      form={form}
      formFields={formFields}
      formDraft={formDraft}
      warningModalStates={warningModalStates}
      notifyChangeInForm={notifyChangeInForm}
      setWarningModalStates={setWarningModalStates}
      showFollowUpModal={showFollowUpModal}
      handleFollowUp={handleFollowUp}
      handleNewVisit={handleNewVisit}
      handleCloseModal={handleCloseModal}
      handleFormValuesChange={handleFormValuesChange}
      isServiceCompleted={serviceCompleted}
      patientId={Number(patientId)}
      followUpDesicion={decision}
    />
  );
}
