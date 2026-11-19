import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createFormFieldsANC } from "@/features/patient-journey/data/ancServiceConstants";
import AncForm from "./components/AncForm";
import { debounce } from "lodash";
import { useGetVisitServiceTypeByPatientQuery } from "../services/patientProfileApi";
import { useParams } from "react-router-dom";
import Loader from "@/components/shared/Loader";
import { transformAncApiToFormData } from "../utils/ancFormTransformers";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useDynamicMedicines } from "../hooks/useDynamicMedicines";
import { ServiceType, WARNING_POP_UP_TIME } from "../data/constants";
import { isServiceCompleted } from "../utils/utilities";
import {
  InchesToCm,
  InchesToFeetInches,
} from "@/utils/helpers/formHelperMethods";
import { useGetPreviousVisitByIdQuery } from "../services/patientProfileApi";
import { Form } from "antd";
import {
  AncFormAutoCalculateValues,
  checkFormWarningMessages,
  getVariantIdMedicine,
  mapPrescriptionsToFormValues,
} from "../data/moduleHelpers";
import { setFormData } from "@/redux/store/slices/formDataSlice";
import { cleanupHiddenFields } from "../data/moduleHelpers";
import { useGetVaccinesQuery } from "../services/immunisationServiceApi";
import { useGetPrescriptionsQuery } from "@/services/medicineApi";
import { recomputeTdVaccinesFromFormDates } from "../utils/vaccineRulesEngine";
import type { GetAncVisitResponse } from "./types";

export default function Anc() {
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
      state.formData?.[`ancForm_patient_${patientId}`] ?? {},
  );
  const selectedPatientData = useSelector(
    (state: RootState) => state?.patientRecords.selectedPatientData,
  );

  const serviceCompleted = isServiceCompleted(
    selectedPatientData?.appointmentServices,
    ServiceType.ANC,
  );

  const {
    completeStockMedicinesOptionsWithOther: medicineOptions,
    stockMedicinePaginationProps,
    supplementOptions,
    isLoading: isLoadingOptions,
    error: optionsError,
  } = useDynamicMedicines({
    skipMedicines: true,
    skipOtc: true,
    skipShortTermContraceptives: true,
    skipLarcContraceptives: true,
    skipCompleteContraceptives: true,
  });

  /** ----------------------------------------------------
   *  RTK QUERIES
   * --------------------------------------------------- */

  const {
    data: currentAncVisitData,
    isLoading: currentAncDataIsLoading,
    refetch: refetchCurrentAncByVisitId,
  } = useGetVisitServiceTypeByPatientQuery(
    {
      patientId: Number(patientId),
      visitId: selectedPatientData?.visit?.id,
      serviceType: ServiceType.ANC,
    },
    {
      skip: !patientId || !selectedPatientData?.visit?.id || !serviceCompleted,
    },
  );

  const typedCurrentAncVisitData = currentAncVisitData as
    | GetAncVisitResponse
    | undefined;

  const { data: vaccinesResponse, isFetching: isVaccinesFetching } =
    useGetVaccinesQuery(
      {
        applies_to: "Adult",
        page: 1,
        limit: 100,
        patientId: patientId ? Number(patientId) : undefined,
      },
      {
        skip: !patientId,
        refetchOnMountOrArgChange: true,
      },
    );

  // Local state for Td dates, updated only when a dateAdministeredN field
  // changes (see handleFormValuesChange). Avoids subscribing the whole
  // component to every form value via Form.useWatch([], form).
  const [tdDates, setTdDates] = useState<Record<string, any>>({});

  const allTdVaccines = useMemo(
    () =>
      (vaccinesResponse?.data || [])
        .filter((v: any) => v.series_name === "Td")
        .sort((a: any, b: any) => a.dose_number - b.dose_number),
    [vaccinesResponse?.data],
  );

  const tdDatesSignature = useMemo(() => {
    return allTdVaccines
      .map((v: any) => {
        const key = `dateAdministered${v.dose_number}`;
        const d = tdDates[key] ?? v.dateAdministered ?? "";
        return `${v.id}:${d}`;
      })
      .join("|");
  }, [allTdVaccines, tdDates]);

  const tdVaccines = useMemo(() => {
    if (!allTdVaccines.length) return [];
    const recomputed = recomputeTdVaccinesFromFormDates(
      allTdVaccines,
      tdDates,
      selectedPatientData?.patientData?.dob,
      selectedPatientData?.patientData?.gender,
    );
    return recomputed.filter(
      (v: any) => v.immunisationDosageStatus !== "Pending",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tdDatesSignature,
    selectedPatientData?.patientData?.dob,
    selectedPatientData?.patientData?.gender,
  ]);

  const {
    data: lastAncVisitData,
    isLoading: LastAncDataIsLoading,
    refetch: refetchLastVisitAncData,
  } = useGetPreviousVisitByIdQuery(
    {
      id: Number(patientId),
      serviceType: ServiceType.ANC,
    },
    {
      skip: !patientId || serviceCompleted,
    },
  );

  const { data: prescriptionResponse } = useGetPrescriptionsQuery(
    { patient_id: Number(patientId) },
    { skip: !patientId },
  );

  /** ----------------------------------------------------
   *  RTK QUERIES
   * --------------------------------------------------- */

  useEffect(() => {
    if (serviceCompleted) refetchCurrentAncByVisitId();
    else if (!serviceCompleted && patientId) refetchLastVisitAncData();
  }, [patientId, selectedPatientData?.visit?.id, serviceCompleted]);

  /** ----------------------------------------------------
   *  SET FORM FIELDS
   * --------------------------------------------------- */
  const medicineListReady =
    medicineOptions?.length && supplementOptions?.length;

  useEffect(() => {
    const hasLmpAleady = !!lastAncVisitData?.data?.anc?.pregnancyInfo?.lmp;
    if (!medicineListReady) return;
    setFormFields(
      createFormFieldsANC(
        medicineOptions,
        stockMedicinePaginationProps,
        supplementOptions,
        serviceCompleted,
        tdVaccines,
        hasLmpAleady,
      ),
    );
  }, [
    medicineListReady,
    lastAncVisitData?.data?.anc,
    typedCurrentAncVisitData?.data?.anc,
    tdVaccines,
    medicineOptions,
  ]);

  /** ----------------------------------------------------
   *  INITIAL VALUES SETTER
   * --------------------------------------------------- */
  const patientHasLastVisit = () => {
    return !!lastAncVisitData?.data?.anc?.ancVitalAssessment;
  };

  const getPatientsLastVisitWeight = () => {
    if (lastAncVisitData?.data?.anc?.ancVitalAssessment?.weight)
      return lastAncVisitData?.data?.anc?.ancVitalAssessment?.weight;
  };

  const getAncVitals = (anc: any) => {
    const updatedHeight =
      anc?.height && typeof anc.height === "object"
        ? anc.height
        : InchesToFeetInches(anc?.height);

    return {
      weight: Number(anc?.weight),
      height: updatedHeight,
      height_cm: anc?.height_cm || InchesToCm(anc?.height),
      temperature: anc?.temperature,
      pulse: anc?.pulse,
      systolic_bp: anc?.systolic_bp,
      diastolic_bp: anc?.diastolic_bp,
      spo2: anc?.spo2,
      respiratory_rate: anc?.respiratory_rate,
      bmi: anc?.body_mass_index,
      blood_group:
        selectedPatientData?.patientData?.additionalInfo?.blood_group,
      last_weight: getPatientsLastVisitWeight(),
    };
  };

  // Use raw API list (allTdVaccines), not engine-recomputed tdVaccines,
  // so this prefill object stays stable across status changes and doesn't
  // clobber user-typed Td dates via form.setFieldsValue.
  const tdDateValues = Object.fromEntries(
    allTdVaccines.map((v: any) => [
      `dateAdministered${v.dose_number}`,
      v.dateAdministered ? v.dateAdministered.split("T")[0] : "",
    ]),
  );

  const setAncFormValues = () => {
    let values: any = {};

    const hasDraft = Object.keys(formDraft).length > 0;
    const currentVisit = typedCurrentAncVisitData?.data?.anc;

    let prescribedMedicines = mapPrescriptionsToFormValues(
      prescriptionResponse?.data || [],
    );

    //Case 1: Service already completed & NO draft → load API visit data
    if (serviceCompleted && !hasDraft) {
      if (!currentVisit) return;

      const transformed = transformAncApiToFormData(currentVisit);

      values = {
        ...transformed,
        ...tdDateValues,
        ...getAncVitals(transformed),
        ...AncFormAutoCalculateValues(transformed, selectedPatientData?.age),
        hasPreviousVisit: patientHasLastVisit(),
        serviceCompleted,
      };
    }

    //Case 2: Service completed & draft exists → load draft
    else if (serviceCompleted && hasDraft) {
      values = {
        serviceCompleted,
        ...cleanupHiddenFields(formFields, formDraft),
        ...getAncVitals({ ...selectedPatientData?.vitals, ...formDraft }),
        ...tdDateValues,
        ...formDraft,
        hasPreviousVisit: patientHasLastVisit(),
      };
    }

    // Case 3: Service NOT completed & patient has vitals → new visit
    else if (!serviceCompleted && hasDraft) {
      const updated = getAncVitals(selectedPatientData?.vitals);
      const lmpValue =
        lastAncVisitData?.data?.anc?.pregnancyInfo?.lmp ||
        typedCurrentAncVisitData?.data?.anc?.pregnancyInfo?.lmp ||
        formDraft.lmp;

      values = {
        ...AncFormAutoCalculateValues({ ...updated, ...formDraft, lmp: lmpValue }, selectedPatientData?.age),
        ...cleanupHiddenFields(formFields, formDraft),
        ...updated,
        hasPreviousVisit: patientHasLastVisit(),
        ...tdDateValues,
        ...formDraft,
        lmp: lmpValue,
      };
    } else if (!serviceCompleted && !hasDraft) {
      const lmpValue =
        lastAncVisitData?.data?.anc?.pregnancyInfo?.lmp ||
        typedCurrentAncVisitData?.data?.anc?.pregnancyInfo?.lmp;

      let autoCalculated = AncFormAutoCalculateValues({
        ...getAncVitals(selectedPatientData?.vitals),
        lmp: lmpValue,
      }, selectedPatientData?.age);

      values = {
        // override vitals if draft has any
        ...cleanupHiddenFields(formFields, autoCalculated),
        ...tdDateValues,
        ...autoCalculated,
        hasPreviousVisit: patientHasLastVisit(),
        lmp: lmpValue,
      };
    }

    //Case 4: No conditions matched — exit gracefully
    else {
      return;
    }

    let completeValues = {
      ...values,
      ...prescribedMedicines,
      patientAge: selectedPatientData?.age,
    };

    // Apply values to form
    form.setFieldsValue(completeValues);

    //Notify parent
    setNotifyChangeInForm(completeValues);
  };

  useEffect(() => {
    setAncFormValues();
  }, [
    typedCurrentAncVisitData?.data?.anc,
    selectedPatientData?.vitals,
    serviceCompleted,
    lastAncVisitData?.data?.anc,
    prescriptionResponse?.data,
    form,
    allTdVaccines,
  ]);

  /** ----------------------------------------------------
   *  DEBOUNCED FUNCTIONS
   * --------------------------------------------------- */

  const debouncedDispatchRef = useRef<any>(null);

  if (!debouncedDispatchRef.current) {
    debouncedDispatchRef.current = debounce((data, pid) => {
      dispatch(
        setFormData({
          formKey: "ancForm",
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
        WARNING_POP_UP_TIME,
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

      // Sync Td dates into local state so engine can recompute statuses
      // without subscribing the whole component to every form value.
      const hasTdChange = Object.keys(changedValues).some((k) =>
        k.startsWith("dateAdministered"),
      );
      if (hasTdChange) {
        setTdDates(
          Object.fromEntries(
            allTdVaccines.map((v: any) => [
              `dateAdministered${v.dose_number}`,
              allValues?.[`dateAdministered${v.dose_number}`],
            ]),
          ),
        );
      }

      const newFormValues: any = {};

      // Handle height changes
      if (changedValues.height) {
        changedValues.height = allValues?.height;
        form.validateFields(["height", "feet"]);
      }

      const updatedMedicine = allValues?.medicine?.map(
        (med: any, idx: number) => {
          const prev =
            prevFormValuesRef.current?.medicine?.find(
              (r: any) => r?._rowId === med?._rowId,
            ) || {};
          const changed = changedValues.medicine?.[idx] || {};

          // Skip completely empty/new rows
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

          // Compute variant_id eagerly when formOfMedicine changes
          if (
            changed.formOfMedicine !== undefined &&
            changed.formOfMedicine !== prev?.formOfMedicine
          ) {
            return {
              ...med,
              formOfMedicine: changed.formOfMedicine,
              variant_id: getVariantIdMedicine(
                med.medicineName,
                changed.formOfMedicine,
                medicineOptions,
                med.strength,
              ) ?? undefined,
            };
          }

          return med;
        },
      );

      // Only update form if anything really changed
      const isDifferent = updatedMedicine?.some((m: any) => {
        const prev =
          prevFormValuesRef.current?.medicine?.find(
            (r: any) => r?._rowId === m?._rowId,
          ) || {};
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
            hasPreviousVisit: patientHasLastVisit(),
            last_weight: getPatientsLastVisitWeight(),
            patientAge: selectedPatientData?.age,
            serviceCompleted,
          },
          form,
        ),
      };
      const autoValues = AncFormAutoCalculateValues(
        safeAllValues,
        selectedPatientData?.age,
      );

      // Merge autoValues only if they differ
      Object.keys(autoValues).forEach((key) => {
        if (safeAllValues[key] !== autoValues[key]) {
          newFormValues[key] = autoValues[key];
        }
      });

      // Debounced Redux save
      const previousValues = prevFormValuesRef.current;
      const mergedValues = {
        ...autoValues,
        ...newFormValues,
        patientAge: selectedPatientData?.age,
      };

      debouncedDispatchRef.current(mergedValues, Number(patientId));
      debouncedNotifyChangeInForm.current(mergedValues);
      form.setFieldsValue(mergedValues);
      debouncedWarning(mergedValues, changedValues, previousValues, formFields);

      prevFormValuesRef.current = mergedValues;
    },
    [
      checkFormWarningMessages,
      form,
      patientId,
      medicineOptions,
      supplementOptions,
      formFields,
      allTdVaccines,
    ],
  );

  /** ----------------------------------------------------
   * RETURN UI
   * --------------------------------------------------- */

  if (
    currentAncDataIsLoading ||
    isLoadingOptions ||
    LastAncDataIsLoading ||
    isVaccinesFetching
  )
    return <Loader />;

  if (optionsError) {
    console.error("Error loading medicine/supplement options:", optionsError);
  }

  return (
    <AncForm
      form={form}
      formFields={formFields}
      formDraft={formDraft}
      warningModalStates={warningModalStates}
      notifyChangeInForm={notifyChangeInForm}
      setWarningModalStates={setWarningModalStates}
      medicineOptions={medicineOptions}
      supplementOptions={supplementOptions}
      handleFormValuesChange={handleFormValuesChange}
      isServiceCompleted={serviceCompleted}
      patientId={Number(patientId)}
      patientVaccinesInfo={vaccinesResponse?.data || []}
      tdVaccines={tdVaccines}
    />
  );
}
