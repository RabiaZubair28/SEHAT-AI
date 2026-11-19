import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Form } from "antd";
import { debounce } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import DispensorServiceForm from "./components/DispenserServiceForm.tsx.tsx";
import Loader from "@/components/shared/Loader.tsx";

import { setFormData } from "@/redux/store/slices/formDataSlice.tsx";
import { RootState } from "@/redux/store/index.tsx";

import {
  cleanupHiddenFields,
  mapPrescriptionsToFormValues,
} from "../data/moduleHelpers.tsx";
import { createDispenserFormFields } from "../data/dispenserServiceConstants.tsx";

import { useGetPrescriptionsQuery } from "@/services/medicineApi.tsx";
import { useGetVisitServiceTypeByPatientQuery } from "../services/patientProfileApi.tsx";
import { useDynamicMedicines } from "../hooks/useDynamicMedicines.ts";

import { isServiceCompleted } from "../utils/utilities.ts";
import { ServiceType } from "../data/constants.tsx";

export default function Dispensor() {
  const { patientId } = useParams();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const notifyChangeInFormRef = useRef<Record<string, any>>({});

  const [formFields, setFormFields] = useState<any[]>([]);
  const [notifyChangeInForm, setNotifyChangeInForm] = useState<
    Record<string, any>
  >({});
  const setNotifyAndRef = (values: any) => {
    notifyChangeInFormRef.current = values;
    setNotifyChangeInForm(values);
  };

  /* ---------------- Redux ---------------- */

  const formDraft = useSelector(
    (state: RootState) =>
      state.formData?.[`dispensing_patient_${patientId}`] ?? {},
  );

  const selectedPatientData = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData,
  );

  /* ---------------- Service Status ---------------- */

  const serviceCompleted = useMemo(() => {
    return isServiceCompleted(
      selectedPatientData?.appointmentServices,
      ServiceType.MEDICINE_DISPENSING,
    );
  }, [selectedPatientData]);

  /* ---------------- APIs ---------------- */

  const { data: prescriptionResponse } = useGetPrescriptionsQuery(
    { patient_id: Number(patientId) },
    { skip: !patientId, refetchOnMountOrArgChange: true },
  );

  const {
    data: currentDispenseVisitRecord,
    isLoading: currentDispenseVisitRecordLoading,
    isFetching: currentDispenseVisitRecordFetching,
    refetch: refetchcurrentDispenseVisitRecord,
  } = useGetVisitServiceTypeByPatientQuery(
    {
      patientId: Number(patientId),
      visitId: selectedPatientData?.visit?.id,
      serviceType: ServiceType.MEDICINE_DISPENSING,
    },
    {
      skip: !patientId || !selectedPatientData?.visit?.id || !serviceCompleted,
      refetchOnMountOrArgChange: true,
    },
  );

  /* ---------------- OTC Medicines ---------------- */

  const {
    otcmedicinesOptions,
    otcPaginationProps,
    isLoading: isOtcMedicineOptiosLoading,
    error: optionsError,
    refetchOtcMedicines,
  } = useDynamicMedicines({
    skipSupplements: true,
    skipMedicines: true,
    skipShortTermContraceptives: true,
    skipLarcContraceptives: true,
    skipCompleteContraceptives: true,
    skipCompleteStock: true,
  });
  
  const medicineListReady = otcmedicinesOptions?.length;

  /* ---------------- Load Visit Data ---------------- */

  useEffect(() => {
    if (serviceCompleted) {
      refetchcurrentDispenseVisitRecord();
    }
  }, [serviceCompleted]);

  /* ---------------- Map Prescriptions → Form ---------------- */

  useEffect(() => {
    if (currentDispenseVisitRecordFetching) return;
    const allItems = serviceCompleted
      ? currentDispenseVisitRecord?.data?.dispenser?.items || []
      : prescriptionResponse?.data || [];

    const prescribedItems = allItems.filter((item: any) => !item.otc);
    const otcItems = allItems.filter((item: any) => item.otc);

    const mappedValues = mapPrescriptionsToFormValues(prescribedItems);

    // Map OTC items separately
    const mappedOtcValues = mapPrescriptionsToFormValues(otcItems);

    const otcRequired =
      currentDispenseVisitRecord?.data?.dispenser?.otcMedRequired ?? false;

    const finalValues = serviceCompleted
      ? {
          ...mappedValues,
          otc_required: otcRequired,
          medicine: mappedOtcValues.previousPrescriptions.map((item: any) => ({
            ...item,
            medicineName:
              item.medicineName || item.method_name || item.supplementName,
            strength: item.strength || "N/A",
            quantity_dispensed_otc: item.quantity_Dispensed,
          })),
        }
      : mappedValues;

    form.setFieldsValue(finalValues);
    setNotifyAndRef(finalValues);
    // setNotifyChangeInForm(finalValues);
  }, [
    prescriptionResponse?.data,
    currentDispenseVisitRecord?.data?.dispenser,
    currentDispenseVisitRecordFetching,
  ]);

  /* ---------------- Build Form Schema ---------------- */

  useEffect(() => {
    if (!medicineListReady) {
      refetchOtcMedicines();
    }

    setFormFields(
      createDispenserFormFields(
        otcmedicinesOptions,
        otcPaginationProps,
        serviceCompleted,
      ),
    );
  }, [medicineListReady, serviceCompleted, otcmedicinesOptions]);

  /* ---------------- Debounced Save ---------------- */

  const debouncedDispatchRef = useRef(
    debounce((data, pid) => {
      dispatch(
        setFormData({
          formKey: "dispensing",
          data,
          patientId: pid,
        }),
      );
    }, 500),
  );

  useEffect(() => {
    return () => {
      debouncedDispatchRef.current.cancel();
    };
  }, []);

  /* ---------------- Form Change Handler ---------------- */

  const handleFormValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      if (changedValues?.medicine) {
        const prevMedicine = notifyChangeInFormRef.current?.medicine || [];
        const prevLength = prevMedicine.length;
        const newLength = allValues.medicine?.length || 0;
        const itemWasAdded = newLength > prevLength;

        if (itemWasAdded) {
          setNotifyAndRef({ ...allValues });
          debouncedDispatchRef.current({ ...allValues }, Number(patientId));
          return;
        }

        const updatedMedicine = allValues.medicine?.map(
          (med: any, idx: number) => {
            const changed = changedValues.medicine?.[idx];
            if (!changed || Object.keys(changed).length === 0) return med;

            const prev = prevMedicine[idx];

            if (
              changed.medicineName !== undefined &&
              changed.medicineName !== prev?.medicineName
            ) {
              return {
                ...med,
                medicineName: changed.medicineName,
                strength: undefined,
                formOfMedicine: undefined,
              };
            }

            if (
              changed.strength !== undefined &&
              changed.strength !== prev?.strength
            ) {
              return {
                ...med,
                strength: changed.strength,
                formOfMedicine: undefined,
              };
            }

            return med;
          },
        );

        form.setFieldsValue({ medicine: updatedMedicine });
        setNotifyAndRef({ ...allValues, medicine: updatedMedicine });
        debouncedDispatchRef.current(
          { ...allValues, medicine: updatedMedicine },
          Number(patientId),
        );
        return;
      }

      if ("otc_required" in changedValues) {
        const cleaned = cleanupHiddenFields(formFields, allValues, form);
        form.setFieldsValue(cleaned);
        setNotifyAndRef(cleaned);
        debouncedDispatchRef.current(cleaned, Number(patientId));
        return;
      }

      setNotifyAndRef(allValues);
      debouncedDispatchRef.current(allValues, Number(patientId));
    },
    [patientId, formFields],
  );

  /* ---------------- UI States ---------------- */

  if (
    isOtcMedicineOptiosLoading ||
    currentDispenseVisitRecordLoading ||
    currentDispenseVisitRecordFetching
  ) {
    return <Loader />;
  }

  if (optionsError) {
    console.error("Error loading medicine options:", optionsError);
  }

  /* ---------------- Render ---------------- */

  return (
    <DispensorServiceForm
      form={form}
      formFields={formFields}
      selectedPatientPrescibedMedicines={
        prescriptionResponse?.data ||
        currentDispenseVisitRecord?.data?.dispenser?.items
      }
      notifyChangeInForm={notifyChangeInForm}
      formDraft={formDraft}
      patientId={Number(patientId)}
      selectedPatientData={selectedPatientData}
      isServiceCompleted={serviceCompleted}
      handleFormValuesChange={handleFormValuesChange}
      otcmedicinesOptions={otcmedicinesOptions}
    />
  );
}
