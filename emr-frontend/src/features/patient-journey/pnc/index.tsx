import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PncForm from "./components/PncForm";
import { debounce } from "lodash";
import { useGetVisitServiceTypeByPatientQuery } from "../services/patientProfileApi";
import { useParams } from "react-router-dom";
import Loader from "@/components/shared/Loader";
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
import { setFormData } from "@/redux/store/slices/formDataSlice";
import { createFormFieldsPnc } from "../data/pncServiceConstants";
import {
  checkFormWarningMessages,
  cleanupHiddenFields,
} from "../data/moduleHelpers";

import { transformPncApiToFormData } from "../utils/pncFormTransformers";
import { useGetVaccinesQuery } from "../services/immunisationServiceApi";
import { recomputeTdVaccinesFromFormDates } from "../utils/vaccineRulesEngine";
import type { GetPncVisitResponse } from "./types";

export default function Pnc() {
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
      state.formData?.[`pncForm_patient_${patientId}`] ?? {},
  );
  const selectedPatientData = useSelector(
    (state: RootState) => state?.patientRecords.selectedPatientData,
  );

  const serviceCompleted = isServiceCompleted(
    selectedPatientData?.appointmentServices,
    ServiceType.PNC,
  );

  /** -------------------- API Calls ------------------------ */
  const {
    data: currentVisitPncRecord,
    isLoading: currentVisitPncLoading,
    refetch: refetchCurrentPncVisitRecord,
  } = useGetVisitServiceTypeByPatientQuery(
    {
      patientId: Number(patientId),
      visitId: selectedPatientData?.visit?.id,
      serviceType: ServiceType.PNC,
    },
    {
      skip: !patientId || !selectedPatientData?.visit?.id || !serviceCompleted,
    },
  );

  const typedCurrentPncVisitData = currentVisitPncRecord as
    | GetPncVisitResponse
    | undefined;

  const {
    data: lastPncVisitData,
    isLoading: lastVisitLoading,
    refetch: refetchLastVisitPncData,
  } = useGetPreviousVisitByIdQuery(
    {
      id: Number(patientId),
      serviceType: ServiceType.PNC,
    },
    {
      skip: !patientId || serviceCompleted,
    },
  );

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
      skip: !patientId || !selectedPatientData?.visit?.id,
    },
  );

  const { data: vaccinesResponse, isFetching: isVaccinesFetching } =
    useGetVaccinesQuery(
      {
        applies_to: "Adult",
        page: 1,
        limit: 100,
        patientId: Number(patientId),
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
    return recomputeTdVaccinesFromFormDates(
      allTdVaccines,
      tdDates,
      selectedPatientData?.patientData?.dob,
      selectedPatientData?.patientData?.gender,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tdDatesSignature,
    selectedPatientData?.patientData?.dob,
    selectedPatientData?.patientData?.gender,
  ]);

  const {
    data: lastAncVisitData,
    isLoading: lastAncDataIsLoading,
    refetch: refetchLastVisitAncData,
  } = useGetPreviousVisitByIdQuery(
    {
      id: Number(patientId),
      serviceType: ServiceType.ANC,
    },
    {
      skip: !patientId,
    },
  );

  const {
    supplementOptions,
    larcContraceptiveOptions,
    shortTermContraceptiveOptions,
    isLoading: isLoadingOptions,
    error: optionsError,
  } = useDynamicMedicines({
    skipCompleteStock: true,
    skipMedicines: true,
    skipOtc: true,
    skipCompleteContraceptives: true,
  });

  /** -------------------- Refetch Logic -------------------- */
  useEffect(() => {
    if (serviceCompleted) {
      refetchCurrentPncVisitRecord();
      refetchCurrentAncByVisitId();
    } else if (patientId) {
      refetchLastVisitAncData();
      refetchLastVisitPncData();
      refetchCurrentAncByVisitId();
    }
  }, [patientId, selectedPatientData?.visit?.id, serviceCompleted]);

  /** -------------------- Form Fields ---------------------- */
  const medicineListReady =
    supplementOptions?.length &&
    larcContraceptiveOptions?.length &&
    shortTermContraceptiveOptions?.length;

  useEffect(() => {
    if (medicineListReady) {
      setFormFields(
        createFormFieldsPnc(
          supplementOptions,
          larcContraceptiveOptions,
          shortTermContraceptiveOptions,
          serviceCompleted,
          tdVaccines,
        ),
      );
    }
  }, [medicineListReady, lastAncVisitData?.data?.anc, tdVaccines]);

  /** -------------------- Helpers --------------------------- */

  const getPncVitals = (pnc: any) => {
    const updatedHeight =
      pnc?.height && typeof pnc.height === "object"
        ? pnc.height
        : InchesToFeetInches(pnc?.height);

    return {
      weight: Number(pnc?.weight),
      height: updatedHeight,
      height_cm: pnc?.height_cm || InchesToCm(pnc?.height),
      temperature: pnc?.temperature,
      pulse: pnc?.pulse,
      systolic_bp: pnc?.systolic_bp,
      diastolic_bp: pnc?.diastolic_bp,
      spo2: pnc?.spo2,
      respiratory_rate: pnc?.respiratory_rate,
      blood_group:
        selectedPatientData?.patientData?.additionalInfo?.blood_group,
      lmp:
        currentAncVisitData?.data?.anc?.pregnancyInfo?.lmp ||
        lastAncVisitData?.data?.anc?.pregnancyInfo?.lmp ||
        pnc?.lmp,
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

  /** -------------------- Set Form Values ------------------- */
  const setPncFormValues = () => {
    let values: any = {};

    const hasDraft = Object.keys(formDraft).length > 0;
    const currentVisit = typedCurrentPncVisitData?.data?.pnc;

    //Case 1: Service already completed & NO draft → load API visit data
    if (serviceCompleted && !hasDraft) {
      if (!currentVisit) return;

      const transformed = transformPncApiToFormData(currentVisit);

      values = {
        ...transformed,
        ...getPncVitals(transformed),
        ...tdDateValues,
        patientAge: selectedPatientData?.age,
      };
    } else if (serviceCompleted && hasDraft) {
      const transformed = transformPncApiToFormData(currentVisit);
      values = {
        ...transformed,
        ...tdDateValues,
        ...formDraft,
        patientAge: selectedPatientData?.age,
      };
    }
    // Case 3: Service NOT completed & patient has vitals → new visit
    else if (!serviceCompleted && !hasDraft) {
      values = {
        ...cleanupHiddenFields(formFields, formDraft),
        ...getPncVitals(selectedPatientData?.vitals),
        ...tdDateValues,
        patientAge: selectedPatientData?.age,
      };
    }
    // Case 4: Service NOT completed & draft exists
    else if (hasDraft && !serviceCompleted) {
      values = {
        ...cleanupHiddenFields(formFields, formDraft),
        ...tdDateValues,
        ...formDraft,
        patientAge: selectedPatientData?.age,
      };
    }

    form.setFieldsValue(values);
    setNotifyChangeInForm(values);
  };

  useEffect(() => {
    setPncFormValues();
  }, [
    typedCurrentPncVisitData?.data?.pnc,
    selectedPatientData?.vitals,
    serviceCompleted,
    lastPncVisitData?.data?.pnc,
    lastAncVisitData?.data?.anc,
    currentAncVisitData?.data?.anc,
    allTdVaccines,
  ]);

  /** -------------------- Debounce Setup -------------------- */
  const debouncedDispatchRef = useRef<any>(
    debounce((data, pid) => {
      dispatch(
        setFormData({
          formKey: "pncForm",
          data,
          patientId: pid,
        }),
      );
    }, 500),
  );

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

  const debouncedNotifyChangeInForm = useRef<any>(
    debounce((allValues) => {
      setNotifyChangeInForm(allValues);
    }, 500),
  );

  /** Cleanup debounces */
  useEffect(() => {
    return () => {
      debouncedDispatchRef.current.cancel();
      debouncedNotifyChangeInForm.current.cancel();
    };
  }, []);

  /** -------------------- Handle Form Change ---------------- */

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

      if (changedValues.height) {
        changedValues.height = allValues.height;
        // If height changed, trigger validation
        form.validateFields(["height", "feet"]);
      }

      let cleanedValues = cleanupHiddenFields(
        formFields,
        { ...allValues, patientAge: selectedPatientData?.age },
        form,
      );

      const previousValues = prevFormValuesRef.current;

      const safeAllValues = {
        ...allValues,
        ...cleanedValues,
      };

      // Debounced warning
      debouncedWarning(
        safeAllValues,
        changedValues,
        previousValues,
        formFields,
      );

      debouncedNotifyChangeInForm.current(safeAllValues);

      form.setFieldsValue(safeAllValues);

      // Debounced Redux save
      debouncedDispatchRef.current(safeAllValues, Number(patientId));

      prevFormValuesRef.current = safeAllValues;
    },
    [
      checkFormWarningMessages,
      form,
      patientId,
      supplementOptions,
      larcContraceptiveOptions,
      shortTermContraceptiveOptions,
      formFields,
      allTdVaccines,
    ],
  );

  /** -------------------- Loading UI ------------------------ */
  if (
    currentVisitPncLoading ||
    isLoadingOptions ||
    lastVisitLoading ||
    lastAncDataIsLoading ||
    currentAncDataIsLoading ||
    isVaccinesFetching
  ) {
    return <Loader />;
  }

  if (optionsError) {
    console.error("Dynamic medicine load error:", optionsError);
  }

  /** -------------------- RETURN UI ------------------------- */
  return (
    <PncForm
      form={form}
      formFields={formFields}
      formDraft={formDraft}
      warningModalStates={warningModalStates}
      notifyChangeInForm={notifyChangeInForm}
      supplementOptions={supplementOptions}
      larcContraceptiveOptions={larcContraceptiveOptions}
      shortTermContraceptiveOptions={shortTermContraceptiveOptions}
      setWarningModalStates={setWarningModalStates}
      handleFormValuesChange={handleFormValuesChange}
      isServiceCompleted={serviceCompleted}
      patientId={Number(patientId)}
      patientVaccinesInfo={vaccinesResponse?.data}
      tdVaccines={tdVaccines}
    />
  );
}
