import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { debounce } from "lodash";
import Loader from "@/components/shared/Loader";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { RootState } from "@/redux/store";
import { ServiceType } from "../data/constants";
import { isServiceCompleted } from "../utils/utilities";
import {
  useGetPreviousVisitByIdQuery,
  useGetVisitServiceTypeByPatientQuery,
} from "../services/patientProfileApi";
import ImmunisationForm from "./components/ImmunisationForm";
import { Form } from "antd";
import { setFormData } from "@/redux/store/slices/formDataSlice";
import {
  checkFormWarningMessages,
  cleanupHiddenFields,
} from "../data/moduleHelpers";
import { getAgeInYears } from "@/utils/ageCalculator";
import { useImmunisationFormFields } from "./hooks/useImmunisationFormFields";
import { useGetVaccinesQuery } from "../services/immunisationServiceApi";
import QRScannerModal from "@/components/shared/QRModal";
import { transformImmunisationApiToFormData } from "../utils/immunisationTransformers";
import { useImmunisationDropdownOptions } from "./hooks/useImmunisationDropdownOptions";
import { WARNING_POP_UP_TIME } from "../data/constants";
import { formatDateToYYYYMMDD } from "@/utils/formats/generalFormatters";
import { recomputeVaccineStatuses } from "../utils/vaccineRulesEngine";
import type { GetImmunisationVisitResponse } from "./types";

const EMPTY = {};

export default function Immunisation() {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [notifyChangeInForm, setNotifyChangeInForm] = useState<any>();
  const [warningModalStates, setWarningModalStates] = useState<any>({
    message: [],
    visible: false,
  });
  const [initialFacilityOption, setInitialFacilityOption] = useState<any>(null);
  const facilityOptionsRef = useRef<any[]>([]);

  const [form] = Form.useForm();

  const levelOfCare = Form.useWatch("levelOfCare", form);

  const {
    districtOptions,
    facilityOptions,
    talukaOptions,
    onDistrictChange,
    facilityPagination,
  } = useImmunisationDropdownOptions(levelOfCare || "");

  useEffect(() => {
    facilityOptionsRef.current = facilityOptions;
  }, [facilityOptions]);

  const handleOnClickQRCode = () => {
    setIsQrOpen(true);
  };

  const handleQrSuccess = (rawValue: string) => {
    const value = String(rawValue || "").trim();

    form.setFieldsValue({
      immunisationNumber: value,
    });

    setIsQrOpen(false);
  };

  const { formFields, womenFormFields } = useImmunisationFormFields({
    onScanClick: handleOnClickQRCode,
  });

  const prevFormValuesRef = useRef<any>({});

  const { patientId } = useParams();
  const dispatch = useDispatch();

  const selectedPatientData = useSelector(
    (state: RootState) => state?.patientRecords.selectedPatientData,
  );
  const patientAge = getAgeInYears(selectedPatientData?.patientData?.dob);

  const formDraft = useSelector(
    (state: RootState) =>
      state.formData?.[`immunisationForm_patient_${patientId}`] ?? EMPTY,
  );

  const serviceCompleted = isServiceCompleted(
    selectedPatientData?.appointmentServices,
    ServiceType.IMMUNISATION,
  );

  /** -------------------- API Calls ------------------------ */
  const {
    data: immunisationCurrentVisitRecord,
    isLoading: isImmunisationCurrentVisitRecordLoading,
    refetch: refetchImmunisationCurrentVisitRecord,
  } = useGetVisitServiceTypeByPatientQuery(
    {
      patientId: Number(patientId),
      visitId: selectedPatientData?.visit?.id,
      serviceType: ServiceType.IMMUNISATION,
    },
    {
      skip: !patientId || !selectedPatientData?.visit?.id || !serviceCompleted,
    },
  );

  const {
    data: immunisationPreviousVisitRecord,
    refetch: refetchPreviousVisitRecord,
  } = useGetPreviousVisitByIdQuery(
    {
      id: Number(patientId),
      serviceType: ServiceType.IMMUNISATION,
    },
    {
      skip: !patientId,
    },
  );

  const currentVisitRecord = immunisationCurrentVisitRecord as
    | GetImmunisationVisitResponse
    | undefined;
  const previousVisitRecord = immunisationPreviousVisitRecord as
    | GetImmunisationVisitResponse
    | undefined;

  useEffect(() => {
    if (serviceCompleted) {
      refetchImmunisationCurrentVisitRecord();
    }
    refetchPreviousVisitRecord();
  }, [patientId, selectedPatientData?.visit?.id, serviceCompleted]);

  /** -------------------- Form Fields ---------------------- */

  /** -------------------- Helpers --------------------------- */
  const getPatientInfoForForm = () => {
    const patient = selectedPatientData?.patientData;
    const immunisationNumber = patient?.immunisation_number;

    return {
      age: getAgeInYears(patient?.dob),
      gender: patient?.gender,
      dob: patient?.dob,
      blood_group: patient?.additionalInfo?.blood_group,
      immunisationNumber,
      isImmunisationNumberPrepopulated: !!immunisationNumber,
    };
  };

  const { data: childVaccinesResponse, isFetching: isChildVaccinesFetching } =
    useGetVaccinesQuery(
      {
        applies_to: "Child",
        patientId: patientId ? Number(patientId) : undefined,
      },
      {
        refetchOnMountOrArgChange: true,
      },
    );

  const { data: womenVaccinesResponse, isFetching: isWomenVaccinesFetching } =
    useGetVaccinesQuery(
      {
        applies_to: "Adult",
        patientId: patientId ? Number(patientId) : undefined,
      },
      {
        refetchOnMountOrArgChange: true,
      },
    );

  const apiVaccines = childVaccinesResponse?.data ?? [];
  const womenVaccines = womenVaccinesResponse?.data ?? [];

  /** -------------------- Set Form Values ------------------- */

  const setImmunisationFormValues = () => {
    let values: any = {};
    let apiImmunisationNumber: string | undefined;

    const hasDraft = Object.keys(formDraft).length > 0;

    const currentVisitImmunisation =
      currentVisitRecord?.data?.immunization?.patient;
    const previousVisitImmunisation =
      previousVisitRecord?.data?.immunization?.patient;

    const currentVisitDoses =
      currentVisitRecord?.data?.immunization?.patient
        ?.immunisationsDoses || [];

    const previousVisitDoses =
      previousVisitRecord?.data?.immunization?.patient
        ?.immunisationsDoses || [];

    const patientInfo = getPatientInfoForForm();
    const {
      immunisationNumber: patientImmunisationNumber,
      ...restPatientInfo
    } = patientInfo;

    // Case 1: Service completed & no draft → Load current visit data
    if (serviceCompleted && !hasDraft) {
      if (!currentVisitImmunisation) return;

      const transformed = transformImmunisationApiToFormData(
        currentVisitImmunisation,
        apiVaccines,
        currentVisitDoses,
      );
      apiImmunisationNumber = transformed.immunisationNumber;

      if (transformed._facilityOption) {
        setInitialFacilityOption(transformed._facilityOption);
      }
      const { _facilityOption, ...formValues } = transformed;
      values = { ...formValues, serviceCompleted };
    }
    // Case 2: Service completed & has draft → Load draft
    else if (serviceCompleted && hasDraft) {
      values = {
        serviceCompleted,
        ...formDraft,
      };
    }
    // Case 3: Service NOT completed & no draft → Load previous visit data
    else if (!serviceCompleted && !hasDraft) {
      if (previousVisitImmunisation) {
        const transformed = transformImmunisationApiToFormData(
          previousVisitImmunisation,
          apiVaccines,
          previousVisitDoses,
        );
        apiImmunisationNumber = transformed.immunisationNumber;

        values = {
          place: transformed.place,
          otherPlace: transformed.otherPlace,
          levelOfCare: transformed.levelOfCare,
          district: transformed.district,
          taluka: transformed.taluka,
          facility: transformed.facility,
          otherFacility: transformed.otherFacility,
          immunisation_card_available: transformed.immunisation_card_available,
          cardProvided: transformed.cardProvided,
          immunisationNumber: transformed.immunisationNumber,
          immunization_records: transformed.immunization_records,
        };
      } else {
        values = {};
      }
    }
    // Case 4: Service NOT completed & has draft → Load draft
    else if (!serviceCompleted && hasDraft) {
      values = {
        ...cleanupHiddenFields(formFields, formDraft),
        ...formDraft,
      };
      if (formDraft._facilityOption) {
        setInitialFacilityOption(formDraft._facilityOption);
      }
    } else {
      return;
    }

    values = {
      ...values,
      ...restPatientInfo,
      immunisationNumber:
        values.immunisationNumber ||
        apiImmunisationNumber ||
        patientImmunisationNumber,
    };
    values.isImmunisationNumberPrepopulated = !!values.immunisationNumber;

    if (apiVaccines.length > 0) {
      const existingRecords = values.immunization_records || [];

      // Create a map of existing records by vaccine_id
      const recordsMap = new Map(
        existingRecords
          .filter((r: any) => r && r.vaccine_id)
          .map((r: any) => [r.vaccine_id, r]),
      );

      apiVaccines.forEach((v: any) => {
        const existing: any = recordsMap.get(v.id);

        // Check if vaccine is already administered based on API response
        const isAdministered = v.immunisationDosageStatus === "Administered";
        const apiDate = v.dateAdministered; // Get date from API

        if (!existing) {
          // Create new record from API data
          recordsMap.set(v.id, {
            vaccine: `${v.display_name}`,
            dueDate: formatDateToYYYYMMDD(v.dueDate),
            vaccine_id: v.id,
            immunization_status: isAdministered,
            administration_date: apiDate || undefined,
            dosageStatus: v.immunisationDosageStatus,
            isAlreadyAdministered: isAdministered,
            order: v.order,
          });
        } else {
          if (isAdministered && apiDate) {
            recordsMap.set(v.id, {
              ...existing,
              vaccine: `${v.display_name}`,
              dueDate: formatDateToYYYYMMDD(v.dueDate),
              immunization_status: true,
              administration_date: apiDate,
              dosageStatus: "Administered",
              isAlreadyAdministered: true,
              order: v.order,
            });
          } else {
            recordsMap.set(v.id, {
              ...existing,
              vaccine: `${v.display_name}`,
              dosageStatus: existing.isAlreadyAdministered
                ? "Administered"
                : v.immunisationDosageStatus,
              administration_date:
                existing.administration_date || apiDate || undefined,
              order: v.order,
            });
          }
        }
      });

      values.immunization_records = (Array.from(recordsMap.values()) as any[]).sort(
        (a: any, b: any) => (a.order ?? Infinity) - (b.order ?? Infinity),
      );
    }

    if (womenVaccines.length > 0) {
      const existingWomenRecords = values.women_immunization_records || [];

      const womenRecordsMap = new Map(
        existingWomenRecords
          .filter((r: any) => r && r.vaccine_id)
          .map((r: any) => [r.vaccine_id, r]),
      );

      womenVaccines.forEach((v: any) => {
        const existing: any = womenRecordsMap.get(v.id);
        const isAdministered = v.immunisationDosageStatus === "Administered";
        const apiDate = v.dateAdministered;

        if (!existing) {
          womenRecordsMap.set(v.id, {
            vaccine: `${v.display_name}`,
            dueDate: formatDateToYYYYMMDD(v.dueDate),
            vaccine_id: v.id,
            immunization_status: isAdministered,
            administration_date: apiDate || undefined,
            dosageStatus: v.immunisationDosageStatus,
            isAlreadyAdministered: isAdministered,
            order: v.order,
          });
          return;
        }

        if (isAdministered && apiDate) {
          womenRecordsMap.set(v.id, {
            ...existing,
            vaccine: `${v.display_name}`,
            dueDate: formatDateToYYYYMMDD(v.dueDate),
            immunization_status: true,
            administration_date: apiDate,
            dosageStatus: "Administered",
            isAlreadyAdministered: true,
            order: v.order,
          });
          return;
        }

        womenRecordsMap.set(v.id, {
          ...existing,
          vaccine: `${v.display_name}`,
          dueDate: formatDateToYYYYMMDD(v.dueDate),
          dosageStatus: existing.isAlreadyAdministered
            ? "Administered"
            : v.immunisationDosageStatus,
          administration_date: existing.administration_date || apiDate || undefined,
          order: v.order,
        });
      });

      values.women_immunization_records = (Array.from(womenRecordsMap.values()) as any[]).sort(
        (a: any, b: any) => (a.order ?? Infinity) - (b.order ?? Infinity),
      );
    }

    form.setFieldsValue(values);

    setNotifyChangeInForm(values);
    prevFormValuesRef.current = values;
    if (values.district) {
      onDistrictChange(values.district);
    }
  };

  useEffect(() => {
    setImmunisationFormValues();
  }, [
    immunisationCurrentVisitRecord,
    immunisationPreviousVisitRecord,
    serviceCompleted,
    formFields.length,
    selectedPatientData,
    apiVaccines,
    womenVaccines,
  ]);

  /** -------------------- Debounce Setup -------------------- */
  const debouncedDispatchRef = useRef<any>(
    debounce((data, pid) => {
      dispatch(
        setFormData({
          formKey: "immunisationForm",
          data,
          patientId: pid,
        }),
      );
    }, 1000),
  );

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

  const debouncedNotifyChangeInForm = useRef<any>(
    debounce((allValues) => {
      setNotifyChangeInForm(allValues);
    }, 500),
  );

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

      const working = { ...allValues };
      const dob = selectedPatientData?.patientData?.dob;
      const gender = selectedPatientData?.patientData?.gender;

      if (
        changedValues.women_immunization_records &&
        working.women_immunization_records
      ) {
        working.women_immunization_records = recomputeVaccineStatuses(
          womenVaccines,
          working.women_immunization_records,
          dob,
          gender,
        );
        form.setFieldsValue({
          women_immunization_records: working.women_immunization_records,
        });
      }
      if (
        changedValues.immunization_records &&
        working.immunization_records
      ) {
        working.immunization_records = recomputeVaccineStatuses(
          apiVaccines,
          working.immunization_records,
          dob,
          gender,
        );
        form.setFieldsValue({
          immunization_records: working.immunization_records,
        });
      }

      const cleanedValues = cleanupHiddenFields(formFields, working, form);
      const previousValues = prevFormValuesRef.current;
      const patientInfo = getPatientInfoForForm();

      const safeAllValues = {
        ...patientInfo,
        ...working,
        ...cleanedValues,
      };

      debouncedWarning(
        safeAllValues,
        changedValues,
        previousValues,
        formFields,
      );

      debouncedNotifyChangeInForm.current(safeAllValues);

      let draftValues = safeAllValues;
      if ("facility" in changedValues && changedValues.facility) {
        const matched = facilityOptionsRef.current.find(
          (o: any) => String(o.value) === String(changedValues.facility),
        );
        if (matched) {
          draftValues = { ...safeAllValues, _facilityOption: matched };
        }
      }
      debouncedDispatchRef.current(draftValues, Number(patientId));
      prevFormValuesRef.current = safeAllValues;
    },
    [patientId, formFields, womenVaccines, apiVaccines, selectedPatientData],
  );

  /** -------------------- Loading UI ---------------- */
  if (isImmunisationCurrentVisitRecordLoading) return <Loader />;

  return (
    <>
      <ImmunisationForm
        form={form}
        formFields={formFields}
        womenFormFields={womenFormFields}
        patientAge={patientAge}
        formDraft={formDraft}
        warningModalStates={warningModalStates}
        notifyChangeInForm={notifyChangeInForm}
        setWarningModalStates={setWarningModalStates}
        handleFormValuesChange={handleFormValuesChange}
        isServiceCompleted={serviceCompleted}
        patientId={Number(patientId)}
        isVaccinesLoading={isChildVaccinesFetching}
        isWomenVaccinesLoading={isWomenVaccinesFetching}
        districtOptions={districtOptions}
        facilityOptions={facilityOptions}
        onDistrictChange={onDistrictChange}
        talukaOptions={talukaOptions}
        facilityPagination={facilityPagination}
        initialFacilityOption={initialFacilityOption}
        hasPreviousVisitData={
          !!previousVisitRecord?.data?.immunization?.patient
        }
      />
      <QRScannerModal
        open={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        onScanSuccess={handleQrSuccess}
      />
    </>
  );
}
