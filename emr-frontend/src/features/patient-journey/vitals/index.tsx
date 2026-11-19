import { useState, useEffect, useCallback, useMemo } from "react";
import { VITALS_FORM_FIELDS } from "../data/vitalsConstants";
import VitalsForm from "./components/VitalsForm";
import { debounce, isEqual } from "lodash";
import { useParams } from "react-router-dom";
import { useGetVitalsByAppointmentIdQuery } from "../services/vitalServiceApi";
import { RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { getAgeInYears } from "@/utils/ageCalculator";
import {
  InchesToCm,
  InchesToFeetInches,
} from "@/utils/helpers/formHelperMethods";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import Loader from "@/components/shared/Loader";

const EMPTY_DRAFT: any = {};

function Vitals() {
  const { patientId } = useParams();
  const patientData = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData
  );
  const [formFields, setFormFields] = useState<any[]>([]);
  const [formValues, setFormValuesOnChange] = useState({});
  const [warningModalStates, setWarningModalStates] = useState<{
    message: string[];
    visible: boolean;
  }>({
    message: [],
    visible: false,
  });
  const dispatch = useDispatch();

  const formDraft = useSelector(
    (state: RootState) =>
      state.formData?.[`vitalsForm_patient_${patientId}`] ?? EMPTY_DRAFT
  );

  // ES: 801: disabling immunisation on vitals and general screening
  // const {
  //   data: vaccinesData,
  //   isLoading: isLoadingVaccines,
  //   refetch: refetchVaccines,
  // } = useGetVaccinesQuery(
  //   {
  //     applies_to: "Child",
  //     patientId: Number(patientId),
  //   },
  //   {
  //     refetchOnMountOrArgChange: true,
  //     refetchOnFocus: true,
  //   }
  // );

  // useEffect(() => {
  //   refetchVaccines();
  // }, [patientId]);

  const checkFormWarningMessages = useCallback(
    (allValues: any, changedValues: any) => {
      if (!changedValues) return;

      const changedKeys = new Set(Object.keys(changedValues));

      const warningFields = formFields
        .flatMap((tab) => tab.fields as any[])
        .filter((field) => (field as any).warningEnableCondition);

      const fieldsToCheck = warningFields.filter((field: any) => {
        const name = field.name;
        if (!name) return false;

        if (changedKeys.has(name)) {
          return true;
        }
        if (name === "weight" && changedKeys.has("height")) {
          return true;
        }
        if (name === "height" && changedKeys.has("weight")) {
          return true;
        }

        return false;
      });

      if (!fieldsToCheck.length) {
        return;
      }

      let hasWarning = false;

      for (const field of fieldsToCheck) {
        const message = field.warningEnableCondition({
          ...allValues,
          patientAge: patientData?.age,
        });

        if (message) {
          hasWarning = true;
          hasWarning = true;
          setWarningModalStates({
            visible: true,
            message: Array.isArray(message) ? message : [message],
          });
          return message;
        }
      }

      if (!hasWarning) {
        setWarningModalStates((prev) => ({
          ...prev,
          visible: false,
          message: [],
        }));
      }

      return undefined;
    },
    [formFields]
  );

  const debouncedCheckWarnings = useMemo(
    () => debounce(checkFormWarningMessages, 1000),
    [checkFormWarningMessages]
  );

  useEffect(() => {
    return () => {
      debouncedCheckWarnings.cancel();
    };
  }, [debouncedCheckWarnings]);

  const visitId = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData?.visit?.id
  );

  const {
    data: vitalsData,
    refetch: refetchVitalsData,
    isLoading: isVitalsLoading,
  } = useGetVitalsByAppointmentIdQuery(visitId!, {
    skip: !visitId,
  });

  useEffect(() => {
    setFormFields(VITALS_FORM_FIELDS);
  }, []);

  useEffect(() => {
    if (!patientData) return;
    // if (isLoadingVaccines) return;

    const status =
      patientData?.patientData?.additionalInfo?.marital_status || null;
    const patientAge = patientData.age;
    const dob = patientData?.patientData?.dob;

    const age = getAgeInYears(dob);

    const newFormValues: any = {
      ...vitalsData?.data,
      height: InchesToFeetInches(vitalsData?.data?.height),
      height_cm: InchesToCm(vitalsData?.data?.height),
      ...(dob && { dob }),
      ...(patientAge != null && { patientAge }),
      age,
      ...(status && { maritalStatus: status }),
      ...(formDraft || {}),
    };

    const previousVitals = patientData?.vitals;
    if (vitalsData?.data && !isEqual(previousVitals, vitalsData?.data)) {
      dispatch(
        setSelectedPatientData({
          ...patientData,
          vitals: vitalsData.data,
        })
      );
    }

    // ES: 801: disabling immunisation on vitals and general screening
    // if (dob && isLessThanTwoYears(dob) && vaccinesData?.data) {
    //   const apiVaccines = vaccinesData.data.map((vaccine: any) => {
    //     const isAdministered =
    //       vaccine.immunisationDosageStatus === "Administered" ||
    //       !!vaccine.dateAdministered;
    //
    //     return {
    //       vaccine_id: vaccine.id,
    //       vaccine: vaccine.code,
    //       administration_date: vaccine.dateAdministered || null,
    //       immunization_status: isAdministered,
    //       dosageStatus: vaccine.immunisationDosageStatus,
    //       isAlreadyAdministered: isAdministered,
    //     };
    //   });
    //
    //   const existingDraftRecords = Array.isArray(
    //     newFormValues.immunization_records
    //   )
    //     ? newFormValues.immunization_records.filter(
    //         (rec: any) => rec !== null && rec !== undefined
    //       )
    //     : [];
    //
    //   const mergedRecords = apiVaccines.map((apiVaccine: any) => {
    //     const draftRecord = existingDraftRecords.find(
    //       (rec: any) => rec && rec.vaccine_id === apiVaccine.vaccine_id
    //     );
    //
    //     if (apiVaccine.isAlreadyAdministered) {
    //       return apiVaccine;
    //     }
    //
    //     const merged = draftRecord
    //       ? { ...apiVaccine, ...draftRecord }
    //       : apiVaccine;
    //
    //     return merged;
    //   });
    //
    //   newFormValues.immunization_records = mergedRecords;
    // }

    setFormValuesOnChange(newFormValues);
  }, [
    patientData,
    vitalsData?.data,
    formDraft,
    dispatch,
    // vaccinesData,
    // isLoadingVaccines,
  ]);

  const handleFormChange = useCallback(
    (allValues: any, changedValues: any) => {
      debouncedCheckWarnings(allValues, changedValues);

      setFormValuesOnChange((prev: any) => ({
        ...prev,
        ...allValues,
        dob: patientData?.patientData?.dob,
        patientAge: patientData?.age,
      }));
    },
    [debouncedCheckWarnings]
  );

  if (isVitalsLoading
    // || isLoadingVaccines
  ) {
    return <Loader />;
  }

  return (
    <VitalsForm
      formFields={formFields}
      warningModalStates={warningModalStates}
      setWarningModalStates={setWarningModalStates}
      setFormValueChange={handleFormChange}
      formValues={formValues}
      patientId={Number(patientId)}
      previousVitalsRecord={
        vitalsData?.data
          ? {
              ...vitalsData.data,
              height: InchesToFeetInches(vitalsData.data.height),
              height_cm: InchesToCm(vitalsData?.data.height),
            }
          : false
      }
      refetchVitalsData={refetchVitalsData}
      refetchVaccines={() => {}}
    />
  );
}

export default Vitals;
