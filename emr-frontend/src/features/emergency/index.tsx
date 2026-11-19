import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { debounce } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { RootState } from "@/redux/store";
import { Form } from "antd";
import { clearFormData, setFormData } from "@/redux/store/slices/formDataSlice";
import { cleanupHiddenFields, getVariantIdMedicine } from "../patient-journey/data/moduleHelpers";
import { useEmergencyDropdownOptions } from "./hooks/useEmergencyDropdownOptions";
import EmergencyForm from "./components/EmergencyForm";
import { useDynamicMedicines } from "../patient-journey/hooks/useDynamicMedicines";
import { createEmergencyFormFields } from "./constants/emergencyConstants";
import { buildEmergencyRequestBody } from "./constants/emergencyTransformers";
import { useGlobalNotification } from "@/hooks/useNotification";
import { useNavigate } from "react-router-dom";
import { useCreateEmergencyPatientMutation } from "./services/emergencyApi";
import Loader from "@/components/shared/Loader";

const EMPTY = {};

export default function Emergency() {
  const [notifyChangeInForm, setNotifyChangeInForm] = useState<any>();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const showNotification = useGlobalNotification();

  const levelOfCare = Form.useWatch("levelOfCare", form);

  const {
    districtOptions,
    facilityOptions,
    onDistrictChange,
    facilityPagination,
  } = useEmergencyDropdownOptions(levelOfCare || "");

  const {
    completeStockMedicinesOptions,
    stockMedicinePaginationProps,
    isLoading: isLoadingMedicines,
  } = useDynamicMedicines({
    skipSupplements: true,
    skipMedicines: true,
    skipOtc: true,
    skipShortTermContraceptives: true,
    skipLarcContraceptives: true,
    skipCompleteContraceptives: true,
  });

  const formFields = useMemo(
    () =>
      createEmergencyFormFields(
        completeStockMedicinesOptions,
        stockMedicinePaginationProps,
      ),
    [completeStockMedicinesOptions],
  );

  const [postEmergency, { isLoading: isSaving }] =
    useCreateEmergencyPatientMutation();

  const prevFormValuesRef = useRef<any>({});

  const { patientId } = useParams();
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.authUser?.user);
  const userFacilityId = user?.facility?.id;

  const formDraft = useSelector(
    (state: RootState) => state.formData?.[`emergency_patient_${0}`] ?? EMPTY,
  );

  const debouncedDispatchRef = useRef<any>(
    debounce((data, pid) => {
      dispatch(
        setFormData({
          formKey: "emergency",
          data,
          patientId: pid,
        }),
      );
    }, 1000),
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

  const handleFormValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      if (!Object.keys(changedValues).length) return;

      // Handle medicine cascading (same as Delivery)
      if (changedValues.medicinesAdministered) {
        const updatedMedicines = allValues.medicinesAdministered?.map(
          (med: any, idx: number) => {
            const prev =
              prevFormValuesRef.current?.medicinesAdministered?.find(
                (r: any) => r?._rowId === med?._rowId,
              ) || {};
            const changed = changedValues.medicinesAdministered?.[idx] || {};

            if (!changed || Object.keys(changed).length === 0) return med;

            // If medicine name changed, reset strength & form
            if (
              changed.medicineName !== undefined &&
              changed.medicineName !== prev?.medicineName
            ) {
              return {
                ...med,
                medicineName: changed.medicineName,
                strength: undefined,
                formOfMedicine: undefined,
                variant_id: undefined,
              };
            }

            // If strength changed, reset form
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

        const isDifferent = updatedMedicines?.some((m: any) => {
          const prev =
            prevFormValuesRef.current?.medicinesAdministered?.find(
              (r: any) => r?._rowId === m?._rowId,
            ) || {};
          return (
            (m?.medicineName || "") !== (prev?.medicineName || "") ||
            (m?.strength || "") !== (prev?.strength || "") ||
            (m?.formOfMedicine || "") !== (prev?.formOfMedicine || "") ||
            (m?.variant_id || "") !== (prev?.variant_id || "")
          );
        });

        if (isDifferent) {
          allValues = {
            ...allValues,
            medicinesAdministered: updatedMedicines,
          };
        }
      }

      const cleanedValues = cleanupHiddenFields(formFields, allValues, form);

      form.setFieldsValue(cleanedValues);

      const safeAllValues = {
        ...allValues,
        ...cleanedValues,
      };

      debouncedNotifyChangeInForm.current(safeAllValues);
      debouncedDispatchRef.current(safeAllValues, Number(patientId));
      prevFormValuesRef.current = safeAllValues;
    },
    [patientId, formFields, form],
  );

  const handleSubmit = async () => {
    try {
      // Validate all fields
      await form.validateFields();

      // Get form values
      const formValues = form.getFieldsValue(true);

      // Clean hidden fields
      const cleanedValues = cleanupHiddenFields(formFields, formValues, form);

      // Build request body
      const payload = buildEmergencyRequestBody(
        cleanedValues,
        completeStockMedicinesOptions,
        userFacilityId,
      );

      // Post to API
      const response = await postEmergency(payload).unwrap();

      showNotification("success", "Emergency Form", response.message);

      // Clear draft after successful save
      dispatch(
        clearFormData({
          formKey: "emergency",
          patientId: patientId,
        }),
      );

      // Navigate back
      navigate(-1);
    } catch (error: any) {
      // Handle validation errors
      if (error?.errorFields) {
        showNotification(
          "error",
          "Validation Error",
          "Please fill all required fields correctly.",
        );
        return;
      }

      // Handle API errors
      const backendMsg =
        error?.data?.message ||
        error?.error ||
        "Something went wrong while saving.";

      showNotification("error", "Emergency Form", backendMsg);
    }
  };

  if (isLoadingMedicines) {
    return <Loader />;
  }

  return (
    <>
      <EmergencyForm
        form={form}
        formFields={formFields}
        formDraft={formDraft}
        notifyChangeInForm={notifyChangeInForm}
        handleFormValuesChange={handleFormValuesChange}
        patientId={Number(patientId)}
        districtOptions={districtOptions}
        facilityOptions={facilityOptions}
        onDistrictChange={onDistrictChange}
        facilityPagination={facilityPagination}
        onSave={handleSubmit}
        isSaving={isSaving}
      />
    </>
  );
}
