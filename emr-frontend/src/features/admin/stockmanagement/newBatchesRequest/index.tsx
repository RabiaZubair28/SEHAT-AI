import Loader from "@/components/shared/Loader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMedicineDispatchFields } from "../constants/medicineBatchesFieldsConstants";
import { useDynamicMedicines } from "@/features/patient-journey/hooks/useDynamicMedicines";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Form } from "antd";
import { debounce } from "lodash";
import { setFormData } from "@/redux/store/slices/formDataSlice";
import NewMedicineBatchRequestForm from "./components/NewBatchRequestForm";
import { getVariantIdMedicine } from "@/features/patient-journey/data/moduleHelpers";

const EMPTY_DRAFT: Record<string, any> = {};

export default function MedicineBatches() {
  const [formFields, setFormFields] = useState<any[]>([]);
  const [notifyChangeInForm, setNotifyChangeInForm] = useState<
    Record<string, any>
  >({});
  const prevFormValuesRef = useRef<any>({});
  const draftRestoredRef = useRef(false);

  const [form] = Form.useForm();

  const dispatch = useDispatch();

  const formDraft = useSelector(
    (state: RootState) => state.formData?.[`medicine_batch`] ?? EMPTY_DRAFT,
  );

  const {
    completeStockMedicinesOptions,
    stockMedicinePaginationProps,
    contraceptivePaginationProps,
    paginatedContraceptiveOptions,
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

  /**
   * ES-795
   *
   * The option list the dropdowns are rendered from: the paginated/searched list
   * plus any option rescued from the saved draft. The medicine the user picks
   * always comes from here, so this is also what the variant lookup has to use -
   * `completeStockMedicinesOptions` alone only reflects the current page/search
   * and will not contain a medicine the user selected before searching again.
   */
  const mergedOptions = useMemo(() => {
    const savedOptions = (formDraft?.medicine || [])
      .filter(Boolean)
      .map((m: any) => m._medicineOption)
      .filter(Boolean);

    return [
      ...completeStockMedicinesOptions,
      ...savedOptions.filter(
        (o: any) => !completeStockMedicinesOptions.find((x) => x.id === o.id),
      ),
    ];
  }, [completeStockMedicinesOptions, formDraft]);

  useEffect(() => {
    if (!medicineListReady || completeStockMedicinesOptionLoading) return;

    if (!draftRestoredRef.current) {
      const hasDraft = Object.keys(formDraft).length > 0;
      if (hasDraft) {
        form.setFieldsValue(formDraft);
        prevFormValuesRef.current = formDraft;
      }
      draftRestoredRef.current = true;
    }

    setFormFields(
      createMedicineDispatchFields(
        mergedOptions,
        stockMedicinePaginationProps,
        contraceptivePaginationProps,
        paginatedContraceptiveOptions,
      ),
    );
  }, [
    medicineListReady,
    completeStockMedicinesOptionLoading,
    mergedOptions,
    paginatedContraceptiveOptions,
  ]);

  /** -------------------- Debounce Setup -------------------- */
  const debouncedDispatchRef = useRef<any>(
    debounce((data) => {
      dispatch(
        setFormData({
          formKey: "medicine_batch",
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
            const selectedOption = mergedOptions.find(
              (o) => o.id === changed.medicineName,
            );
            return {
              ...med,
              medicineName: changed.medicineName,
              _medicineOption: selectedOption ?? med._medicineOption,
              strength: undefined,
              formOfMedicine: undefined,
              other_medicine: undefined,
              variantId: undefined,
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
              variantId: undefined,
            };
          }

          if (changed.is_otc !== undefined) {
            const isOtcChecked =
              Array.isArray(med.is_otc) && med.is_otc.includes(true);
            if (!isOtcChecked) {
              return {
                ...med,
                limit_quantity: undefined,
              };
            }
          }

          // Capture the variant when the final cascading field changes.
          if (
            changed.formOfMedicine !== undefined &&
            changed.formOfMedicine !== prev?.formOfMedicine
          ) {
            // ES-795: Prefer the option stored on the row (it survives paging and searching) but still fall through
            const medicineOpt = [
              med._medicineOption,
              ...mergedOptions,
              ...paginatedContraceptiveOptions,
            ].filter(Boolean); // filter to drop undefined

            return {
              ...med,
              variantId:
                getVariantIdMedicine(
                  med.medicineName,
                  med.formOfMedicine,
                  medicineOpt,
                  med.strength,
                ) ?? undefined,
            };
          }

          return med;
        },
      );

      const updatedContraceptive = allValues?.contraceptive?.map(
        (med: any, idx: number) => {
          const changed = changedValues.contraceptive?.[idx] || {};

          if (!changed || Object.keys(changed).length === 0) return med;

          if (changed.is_otc !== undefined) {
            const isOtcChecked =
              Array.isArray(med.is_otc) && med.is_otc.includes(true);
            if (!isOtcChecked) {
              return { ...med, limit_quantity: undefined };
            }
          }
          // ES-795: Prefer the option stored on the row, but keep the paginated list as a fallback
          const resolvedVariantId = med.medicineName
            ? getVariantIdMedicine(
                med.medicineName,
                null,
                [med._medicineOption, ...paginatedContraceptiveOptions].filter(Boolean), // filter to drop undefined
                null,
              )
            : undefined;
          return { ...med, variantId: resolvedVariantId };
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
          (m?.variantId ?? "") !== (prev?.variantId ?? "") ||
          (m?.limit_quantity ?? "") !== (prev?.limit_quantity ?? "")
        );
      });

      if (isDifferent) {
        newFormValues.medicine = updatedMedicine;
      }

      const isContraceptiveDifferent = updatedContraceptive?.some(
        (m: any) => {
          const prev =
            prevFormValuesRef.current?.contraceptive?.find(
              (r: any) => r?._rowId === m?._rowId,
            ) || {};
          return (
            (m?.limit_quantity ?? "") !== (prev?.limit_quantity ?? "") ||
            (m?.medicineName || "") !== (prev?.medicineName || "") ||
            (m?.variantId ?? "") !== (prev?.variantId ?? "")
          );
        },
      );

      if (isContraceptiveDifferent)
        newFormValues.contraceptive = updatedContraceptive;

      let updated = {
        ...allValues,
        ...newFormValues,
      };
      form.setFieldsValue(updated);
      setNotifyChangeInForm(updated);
      debouncedDispatchRef.current(updated);
      prevFormValuesRef.current = updated;
    },
    [form, mergedOptions, paginatedContraceptiveOptions],
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

  return (
    <>
      <NewMedicineBatchRequestForm
        form={form}
        formFields={formFields}
        handleFormValuesChange={handleFormValuesChange}
        notifyChangeInForm={notifyChangeInForm}
      />
    </>
  );
}
