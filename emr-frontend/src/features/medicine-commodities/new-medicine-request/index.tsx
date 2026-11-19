import Loader from "@/components/shared/Loader";
import { useCallback, useEffect, useRef, useState } from "react";
import { createCommodityMedicineFields } from "../constants/NewCommodityFormFields";
import { useDynamicMedicines } from "@/features/patient-journey/hooks/useDynamicMedicines";
import { getVariantIdMedicine } from "@/features/patient-journey/data/moduleHelpers";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Form } from "antd";
import { debounce } from "lodash";
import { setFormData } from "@/redux/store/slices/formDataSlice";
import NewCommodityRequestForm from "./components/NewCommodityRequestForm";

// Contraceptive rows have no strength/form field, so the variant is known as soon as the medicine is chosen.
const resolveContraceptiveVariants = (
  allValues: any,
  changedValues: any,
  contraceptiveOptions: any[],
) =>
  allValues?.contraceptive?.map((med: any, idx: number) => {
    if (!("medicineName" in (changedValues.contraceptive?.[idx] || {}))) {
      return med;
    }

    // Select was cleared
    if (!med.medicineName) {
      return { ...med, variant_id: undefined };
    }

    return {
      ...med,
      variant_id:
        getVariantIdMedicine(
          med.medicineName,
          null,
          contraceptiveOptions,
          null,
        ) ?? undefined,
    };
  });

export default function NewCommodityRequests() {
  const [formFields, setFormFields] = useState<any[]>([]);
  const [notifyChangeInForm, setNotifyChangeInForm] = useState<
    Record<string, any>
  >({});
  const prevFormValuesRef = useRef<any>({});

  const [form] = Form.useForm();

  const dispatch = useDispatch();

  const formDraft = useSelector(
    (state: RootState) => state.formData?.[`medicine_commodity`] ?? {},
  );

  const {
    completeStockMedicinesOptions,
    stockMedicinePaginationProps,
    paginatedContraceptiveOptions,
    contraceptivePaginationProps,
    isLoading: completeStockMedicinesOptionLoading,
    error: optionsError,
  } = useDynamicMedicines({
    skipSupplements: true,
    skipMedicines: true,
    skipOtc: true,
    skipShortTermContraceptives: true,
    skipLarcContraceptives: true,
  });

  const medicineListReady = completeStockMedicinesOptions?.length;

  useEffect(() => {
    const hasDraft = Object.keys(formDraft).length > 0;
    if (hasDraft) {
      form.setFieldsValue(hasDraft);
    }
  }, []);

  useEffect(() => {
    if (!medicineListReady) return;
    setFormFields(
      createCommodityMedicineFields(
        completeStockMedicinesOptions,
        stockMedicinePaginationProps,
        paginatedContraceptiveOptions,
        contraceptivePaginationProps,
      ),
    );
  }, [
    medicineListReady,
    completeStockMedicinesOptions,
    paginatedContraceptiveOptions,
  ]);

  /** -------------------- Debounce Setup -------------------- */
  const debouncedDispatchRef = useRef<any>(
    debounce((data) => {
      dispatch(
        setFormData({
          formKey: "medicine_commodity",
          data,
        }),
      );
    }, 500),
  );

  //-------------------- Handle Form Change ---------------- */
  const handleFormValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      if (!Object.keys(changedValues).length) return;

      const newFormValues: any = {};

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
                completeStockMedicinesOptions,
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

      if (changedValues.contraceptive) {
        newFormValues.contraceptive = resolveContraceptiveVariants(
          allValues,
          changedValues,
          paginatedContraceptiveOptions,
        );
      }

      let updated = {
        ...allValues,
        ...newFormValues,
      };
      form.setFieldsValue(updated);
      setNotifyChangeInForm(updated);
      debouncedDispatchRef.current(updated);
      prevFormValuesRef.current = updated;
    },
    [form, formFields, paginatedContraceptiveOptions],
  );

  /** Cleanup debounces */
  useEffect(() => {
    return () => {
      debouncedDispatchRef.current.cancel();
    };
  }, []);

  ///-------------------- UI Loading (AFTER all hooks) ------------------------ ///

  if (completeStockMedicinesOptionLoading) {
    return <Loader />;
  }

  if (optionsError) {
    console.error("Error loading medicine options:", optionsError);
  }

  // Optional: Add warnings for certain conditions if needed

  return (
    <>
      <NewCommodityRequestForm
        form={form}
        formFields={formFields}
        handleFormValuesChange={handleFormValuesChange}
        notifyChangeInForm={notifyChangeInForm}
        stockmedicineOptions={completeStockMedicinesOptions}
        contraceptiveOptions={paginatedContraceptiveOptions}
      />
    </>
  );
}
