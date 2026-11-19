import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import DeliveryForm from "./components/DeliveryForm";
import { Form } from "antd";
import {
  useGetPreviousVisitByIdQuery,
  useGetVisitServiceTypeByPatientQuery,
} from "../services/patientProfileApi";
import { SERVICES_STATUS, ServiceType } from "../data/constants";
import {
  computePregnancyFromLmp,
  getVariantIdMedicine,
} from "../data/moduleHelpers";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { cleanupHiddenFieldsNewborn } from "../data/moduleHelpers";
import {
  buildDeliveryRequestBody,
  DeliveryProgressStatus,
  DeliveryTabKey,
  transformDischargeApiToForm,
  transformNewbornApiToForm,
  transformPostDeliveryApiToForm,
  transformPreDeliveryApiToForm,
  transformReferralApiToForm,
} from "../utils/deliveryFormTransformers";
import {
  useGetChildrenByAppointmentServiceQuery,
  useGetVaccinesQuery,
  usePostDeliveryVisitMutation,
  useUpdateDeliveryVisitMutation,
} from "../services/deliveryServiceApi";
import { isServiceCompleted } from "../utils/utilities";
import { useNavigate } from "react-router-dom";
import { useDynamicMedicines } from "../hooks/useDynamicMedicines";
import Loader from "@/components/shared/Loader";
import { createDeliveryFormFields } from "../data/deliveryConstants";
import { useGlobalNotification } from "@/hooks/useNotification";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import QRModal from "@/components/shared/QRModal";
import { debounce } from "lodash";
import { setFormData, clearFormData } from "@/redux/store/slices/formDataSlice";
import {
  FormValues,
  getWarningMessages,
} from "@/features/patient-journey/delivery/helpers";
import { VaccineStatus } from "@/features/patient-journey/utils/vaccineRulesEngine";

export default function Delivery() {
  const [form] = Form.useForm();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [activeDeliveryTab, setActiveDeliveryTab] =
    useState<DeliveryTabKey>("1");

  const [currentNewbornIndex, setCurrentNewbornIndex] = useState<number | null>(
    null,
  );
  const [tabLocks, setTabLocks] = useState<Record<string, boolean>>({
    "1": false,
    "2": false,
    "3": false,
    "4": false,
    "5": false,
  });
  const [tabsSavedOnce, setTabsSavedOnce] = useState<Record<string, boolean>>({
    "1": false,
    "2": false,
    "3": false,
    "4": false,
    "5": false,
  });
  const [formValues, setFormValues] = useState<FormValues>({
    hasAncRecord: false,
  });
  const navigate = useNavigate();
  const [warningModalStates, setWarningModalStates] = useState<{
    message: string[];
    visible: boolean;
  }>({
    message: [],
    visible: false,
  });
  const dispatch = useDispatch();
  const { patientId } = useParams();
  const [postDeliveryVisit, { isLoading: isPostDeliveryVisitLoading }] =
    usePostDeliveryVisitMutation();
  const [updateDeliveryVisit, { isLoading: isUpdateDeliveryVisitLoading }] =
    useUpdateDeliveryVisitMutation();
  const showNotification = useGlobalNotification();

  const prevFormValuesRef = useRef<FormValues>({});
  const isHydratingRef = useRef(false);
  const originalNewbornDataRef = useRef<Record<number, any>>({});
  const hasInitializedRef = useRef(false);

  const actionToProgressStatus = (
    action: string,
    tabKey?: DeliveryTabKey,
  ): DeliveryProgressStatus => {
    if (tabKey === "4" && action === "save") return "Discharged";

    switch (action) {
      case "falseLabor":
        return "False labor";
      case "referToCemonc":
        return "Refer to CEmONC facility";
      case "lama":
        return "LAMA";
      case "save":
      default:
        return "Continue";
    }
  };

  const selectedPatientData = useSelector(
    (state: RootState) => state?.patientRecords.selectedPatientData,
  );

  const serviceCompleted = isServiceCompleted(
    selectedPatientData?.appointmentServices,
    ServiceType.DELIVERY,
  );

  // Get draft from redux
  const draftData = useSelector(
    (state: RootState) => state.formData?.[`delivery_patient_${patientId}`],
  );

  const { data: vaccinesResp } = useGetVaccinesQuery({
    dose_number: [0],
    applies_to: "Child",
  });

  const vaccines = useMemo(() => vaccinesResp?.data || [], [vaccinesResp]);

  const appointmentServiceId = useMemo(() => {
    return selectedPatientData?.appointmentServices?.find(
      (s: any) => s.service?.name === ServiceType.DELIVERY,
    )?.id;
  }, [selectedPatientData]);

  // Fetch current visit delivery record
  const {
    data: deliveryCurrentVisitRecord,
    isLoading: isDeliveryCurrentVisitRecordLoading,
    isFetching: isDeliveryCurrentVisitRecordFetching,
  } = useGetVisitServiceTypeByPatientQuery(
    {
      patientId: Number(patientId),
      visitId: selectedPatientData?.visit?.id,
      serviceType: ServiceType.DELIVERY,
    },
    {
      skip: !patientId || !selectedPatientData?.visit?.id,
      refetchOnMountOrArgChange: true,
    },
  );

  const { data: childrenData, isLoading: isLoadingChildren } =
    useGetChildrenByAppointmentServiceQuery(
      { appointmentServiceId: appointmentServiceId! },
      {
        skip: !appointmentServiceId || !tabsSavedOnce["3"],
      },
    );

  const {
    completeStockMedicinesOptions: medicineOptionsWithoutOther,
    stockMedicinePaginationProps,
    isLoading: isLoadingOptions,
  } = useDynamicMedicines({
    skipSupplements: true,
    skipMedicines: true,
    skipOtc: true,
    skipShortTermContraceptives: true,
    skipLarcContraceptives: true,
  });

  const formFields = useMemo(
    () =>
      createDeliveryFormFields(
        medicineOptionsWithoutOther,
        stockMedicinePaginationProps,
      ),
    [medicineOptionsWithoutOther],
  );

  const warningFields = useMemo(() => {
    const fields = formFields
      .flatMap((tab: any) => {
        return (
          tab.fields?.flatMap((field: any) => {
            if (
              field.type === "formList" ||
              field.type === "formList_unscrollable"
            ) {
              return field.fields || [];
            }
            return field;
          }) || []
        );
      })
      .filter(
        (field: any) => typeof field.warningEnableCondition === "function",
      );
    return fields;
  }, [formFields]);

  const {
    data: previousAncVisit,
    isLoading: isLoadingAncVisit,
    isFetching: isFetchingAncVisit,
  } = useGetPreviousVisitByIdQuery(
    {
      id: Number(patientId),
      serviceType: ServiceType.ANC,
      usedIn: ServiceType.DELIVERY,
    },
    {
      skip: !patientId,
    },
  );

  // Check if any tab is currently unlocked (user is editing)
  const hasUnlockedTabs = useMemo(() => {
    return Object.entries(tabLocks).some(([, locked]) => !locked);
  }, [tabLocks]);

  // Save draft to redux (only if editing and service not completed)
  const saveDraft = useCallback(
    (values: any) => {
      if (!hasUnlockedTabs || serviceCompleted) {
        return;
      }

      dispatch(
        setFormData({
          formKey: "delivery",
          patientId: patientId,
          data: values,
        }),
      );
    },
    [hasUnlockedTabs, serviceCompleted, patientId, dispatch],
  );

  const debouncedSaveDraft = useMemo(
    () => debounce(saveDraft, 500),
    [saveDraft],
  );

  // Clear draft (called after successful save)
  const clearDraft = useCallback(() => {
    dispatch(
      clearFormData({
        formKey: "delivery",
        patientId: patientId,
      }),
    );
  }, [patientId, dispatch]);

  const handleOnClickQRCode = useCallback((newbornIndex: number) => {
    setCurrentNewbornIndex(newbornIndex);
    setIsQrOpen(true);
  }, []);

  const handleQrSuccess = useCallback(
    (rawValue: string) => {
      const value = String(rawValue || "").trim();

      if (currentNewbornIndex !== null) {
        const currentNewborns = formValues?.newbornAssessments || [];
        const updatedNewborns = [...currentNewborns];

        if (updatedNewborns[currentNewbornIndex]) {
          updatedNewborns[currentNewbornIndex] = {
            ...updatedNewborns[currentNewbornIndex],
            immunisationNumber: value,
          };

          setFormValues((prev) => ({
            ...prev,
            newbornAssessments: updatedNewborns,
          }));

          form.setFieldsValue({
            newbornAssessments: updatedNewborns,
          });
        }
      }

      setIsQrOpen(false);
      setCurrentNewbornIndex(null);
    },
    [currentNewbornIndex, formValues, form],
  );

  const getDeliveryVitals = useCallback(
    (vitals: any) => {
      return {
        temperature: vitals?.temperature,
        pulse: vitals?.pulse,
        systolicBP: vitals?.systolic_bp,
        diastolicBP: vitals?.diastolic_bp,
        respiratoryRate: vitals?.respiratory_rate,
        spo2: vitals?.spo2,
        blood_group:
          selectedPatientData?.patientData?.additionalInfo?.blood_group,
      };
    },
    [selectedPatientData?.patientData?.additionalInfo?.blood_group],
  );

  // ============================================
  // SINGLE UNIFIED DATA LOADING EFFECT
  // ============================================
  useEffect(() => {
    // Wait for all dependencies
    if (!formFields?.length || !medicineOptionsWithoutOther?.length) {
      return;
    }

    // Wait for ANC and API queries to complete
    if (
      isLoadingAncVisit ||
      isFetchingAncVisit ||
      isDeliveryCurrentVisitRecordLoading ||
      isDeliveryCurrentVisitRecordFetching
    ) {
      return;
    }

    // Only initialize once
    if (hasInitializedRef.current) {
      return;
    }

    isHydratingRef.current = true;

    // STEP 1: Build base data (ANC + Vitals) - ALWAYS
    const baseData: any = {};

    if (previousAncVisit) {
      const lmp = previousAncVisit?.data?.anc?.pregnancyInfo?.lmp;
      baseData.hasAncRecord = true;
      baseData.lmp = lmp;
      baseData.signs_of_high_risk_pregnancy =
        previousAncVisit?.data?.anc?.ancVitalAssessment?.warning_signs;
      if (lmp) {
        const derived = computePregnancyFromLmp(lmp);
        Object.assign(baseData, derived);
      }
    }

    if (selectedPatientData?.visit?.vitalAssessment) {
      const vitals = getDeliveryVitals(
        selectedPatientData?.visit?.vitalAssessment,
      );
      Object.assign(baseData, vitals);
    }

    // STEP 2: Check for API data (saved delivery record)
    const delivery = deliveryCurrentVisitRecord?.data?.delivery;
    const hasDeliveryData =
      delivery?.preDeliveryAssesment ||
      delivery?.postDeliveryAssesment ||
      (delivery?.newbornAssesment && delivery.newbornAssesment.length > 0) ||
      delivery?.deliveryDischargeDetails ||
      (delivery?.deliveryReferralDetails &&
        delivery.deliveryReferralDetails.length > 0);

    let finalData = { ...baseData };
    const nextLocks: Record<string, boolean> = {
      "1": false,
      "2": false,
      "3": false,
      "4": false,
      "5": false,
    };
    const nextSavedOnce: Record<string, boolean> = {
      "1": false,
      "2": false,
      "3": false,
      "4": false,
      "5": false,
    };

    // STEP 3: If API data exists, merge it (API has priority)
    if (hasDeliveryData && delivery) {
      // TAB 1: PreDelivery
      if (delivery.preDeliveryAssesment) {
        Object.assign(
          finalData,
          transformPreDeliveryApiToForm(delivery.preDeliveryAssesment),
        );
        nextLocks["1"] = true;
        nextSavedOnce["1"] = true;
      }

      // TAB 2: PostDelivery
      if (delivery.postDeliveryAssesment) {
        Object.assign(
          finalData,
          transformPostDeliveryApiToForm(
            delivery.postDeliveryAssesment,
          ),
        );
        nextLocks["2"] = true;
        nextSavedOnce["2"] = true;
      }

      // TAB 3: Newborn
      if (delivery.newbornAssesment?.length) {
        Object.assign(
          finalData,
          transformNewbornApiToForm(
            delivery.newbornAssesment,
            delivery.deliveryPatients,
          ),
        );

        // Store original immunization records
        const newbornData = transformNewbornApiToForm(
          delivery.newbornAssesment,
          delivery.deliveryPatients,
        );

        newbornData.newbornAssessments?.forEach((nb: any, index: number) => {
          if (nb.immunization_records?.length > 0) {
            originalNewbornDataRef.current[index] = {
              ...nb,
              immunization_records: [...nb.immunization_records],
            };
          }
        });

        nextLocks["3"] = true;
        nextSavedOnce["3"] = true;
      }

      // TAB 4: Discharge
      if (delivery.deliveryDischargeDetails) {
        Object.assign(
          finalData,
          transformDischargeApiToForm(delivery.deliveryDischargeDetails),
        );
        nextLocks["4"] = true;
        nextSavedOnce["4"] = true;
      }

      // TAB 5: Referral
      if (delivery.deliveryReferralDetails?.length) {
        Object.assign(
          finalData,
          transformReferralApiToForm(delivery.deliveryReferralDetails),
        );
        nextLocks["5"] = true;
        nextSavedOnce["5"] = true;
      }

      // Set locks when API data exists
      setTabLocks(nextLocks);
      setTabsSavedOnce(nextSavedOnce);

      //  MERGE DRAFT on top of API data (for unlocked tabs)
      if (draftData && Object.keys(draftData).length > 0) {
        finalData = { ...finalData, ...draftData };
      }
    }
    // STEP 4: If no API data, check for draft
    else if (draftData && Object.keys(draftData).length > 0) {
      finalData = { ...finalData, ...draftData };
    }

    // STEP 5: Apply final data to form
    if (Object.keys(finalData).length > 0) {
      if (
        !finalData.newbornAssessments ||
        finalData.newbornAssessments.length === 0
      ) {
        finalData.newbornAssessments = [{}]; // Initialize with one empty newborn
      }

      form.setFieldsValue(finalData);

      setFormValues((prev) => {
        const merged = { ...prev, ...finalData };
        prevFormValuesRef.current = merged;
        return merged;
      });
    }

    isHydratingRef.current = false;
    hasInitializedRef.current = true;
  }, [
    formFields,
    medicineOptionsWithoutOther,
    previousAncVisit,
    selectedPatientData?.visit?.vitalAssessment,
    deliveryCurrentVisitRecord,
    draftData,
    form,
    getDeliveryVitals,
    isLoadingAncVisit,
    isFetchingAncVisit,
    isDeliveryCurrentVisitRecordLoading,
    isDeliveryCurrentVisitRecordFetching,
  ]);

  const handleWarningCheck = useMemo(
    () =>
      debounce((changedValues: FormValues, allValues: FormValues) => {
        if (isHydratingRef.current) return;

        const messages = getWarningMessages(
          changedValues,
          prevFormValuesRef.current,
          warningFields,
          allValues,
        );

        if (messages.length) {
          setWarningModalStates({
            visible: true,
            message: messages,
          });
        }
      }, 1200),
    [warningFields],
  );

  const handleValuesChange = useCallback(
    (changedValues: FormValues, allValues: FormValues) => {
        if (isHydratingRef.current) {
          return;
        }

        // Handle LMP change
        if (changedValues?.lmp) {
          const derived = allValues.lmp
            ? computePregnancyFromLmp(allValues.lmp)
            : {};

          queueMicrotask(() => {
            isHydratingRef.current = true;
            form.setFieldsValue({
              gestationalAge: derived?.gestationalAge ?? undefined,
              trimester: derived?.trimester ?? undefined,
              ...derived,
            });
            form.validateFields(["gestationalAge", "trimester"]);
            isHydratingRef.current = false;
          });

          Object.assign(allValues, derived);
        }

        // Handle newborn vaccines seeding
        if (changedValues?.newbornAssessments && vaccines?.length) {
          const newborns = allValues?.newbornAssessments || [];
          allValues.newbornAssessments = newborns.map(
            (nb: any, index: number) => {
              const originalData = originalNewbornDataRef.current[index];
              if (originalData?.immunization_records?.length > 0) {
                return {
                  ...nb,
                  immunization_records: originalData.immunization_records,
                };
              }

              if (
                Array.isArray(nb?.immunization_records) &&
                nb.immunization_records.length > 0
              ) {
                return nb;
              }

              return {
                ...nb,
                immunization_records: vaccines.map((v: any) => ({
                  vaccineId: v.id,
                  vaccine: v.display_name,
                  dateAdministered: undefined,
                  immunization_status: false,
                  status: "Scheduled",
                })),
              };
            },
          );

          queueMicrotask(() => {
            if (!isHydratingRef.current) {
              form.setFieldsValue({
                newbornAssessments: allValues.newbornAssessments,
              });
            }
          });
        }

        // Handle mother medicines cascading
        if (changedValues.medicinesAdministered) {
          const updatedMedicines = allValues.medicinesAdministered?.map(
            (med: any, idx: number) => {
              const prev =
                prevFormValuesRef.current?.medicinesAdministered?.find(
                  (r: any) => r?._rowId === med?._rowId,
                ) || {};
              const changed = changedValues.medicinesAdministered?.[idx] || {};

              if (!changed || Object.keys(changed).length === 0) return med;

              if (
                changed.medicineName !== undefined &&
                changed.medicineName !== prev?.medicineName
              ) {
                // ES-774: Look up label from options for display fallback on refresh
                const selectedOption = medicineOptionsWithoutOther.find(
                  (o: any) => o.value === changed.medicineName,
                );
                return {
                  ...med,
                  medicineName: changed.medicineName,
                  medicine_label:
                    selectedOption?.label ?? med.medicine_label,
                  strength: undefined,
                  formOfMedicine: undefined,
                  other_medicine: undefined,
                  variant_id: undefined,
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
                  variant_id: undefined,
                };
              }

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
                      medicineOptionsWithoutOther,
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

        // Handle newborn medicines cascading
        if (changedValues?.newbornAssessments) {
          const currentNewborns = allValues?.newbornAssessments || [];
          const prevNewborns =
            prevFormValuesRef.current?.newbornAssessments || [];

          const updatedNewborns = currentNewborns.map(
            (newborn: any, nbIdx: number) => {
              const prevNewborn =
                prevNewborns.find(
                  (r: any) => r?._rowId === newborn?._rowId,
                ) || {};
              const changedNewborn =
                changedValues.newbornAssessments?.[nbIdx] || {};

              if (changedNewborn.medicinesAdministeredNewborn) {
                const medicines = newborn.medicinesAdministeredNewborn || [];
                const prevMedicines =
                  prevNewborn.medicinesAdministeredNewborn || [];

                const updatedMedicines = medicines.map(
                  (med: any, medIdx: number) => {
                    const prevMed =
                      prevMedicines.find(
                        (r: any) => r?._rowId === med?._rowId,
                      ) || {};
                    const changedMed =
                      changedNewborn.medicinesAdministeredNewborn?.[medIdx] ||
                      {};

                    if (!changedMed || Object.keys(changedMed).length === 0)
                      return med;

                    if (
                      changedMed.medicineNameNewborn !== undefined &&
                      changedMed.medicineNameNewborn !==
                        prevMed?.medicineNameNewborn
                    ) {
                      // ES-774: Look up label from options for display fallback on refresh
                      const selectedOption = medicineOptionsWithoutOther.find(
                        (o: any) => o.value === changedMed.medicineNameNewborn,
                      );
                      return {
                        ...med,
                        medicineNameNewborn: changedMed.medicineNameNewborn,
                        medicine_label:
                          selectedOption?.label ?? med.medicine_label,
                        strengthNewborn: undefined,
                        formOfMedicineNewborn: undefined,
                        variant_id: undefined,
                      };
                    }

                    if (
                      changedMed.strengthNewborn !== undefined &&
                      changedMed.strengthNewborn !== prevMed?.strengthNewborn
                    ) {
                      return {
                        ...med,
                        strengthNewborn: changedMed.strengthNewborn,
                        formOfMedicineNewborn: undefined,
                        variant_id: undefined,
                      };
                    }

                    if (
                      changedMed.formOfMedicineNewborn !== undefined &&
                      changedMed.formOfMedicineNewborn !==
                        prevMed?.formOfMedicineNewborn
                    ) {
                      return {
                        ...med,
                        formOfMedicineNewborn: changedMed.formOfMedicineNewborn,
                        variant_id:
                          getVariantIdMedicine(
                            med.medicineNameNewborn,
                            changedMed.formOfMedicineNewborn,
                            medicineOptionsWithoutOther,
                            med.strengthNewborn,
                          ) ?? undefined,
                      };
                    }

                    return med;
                  },
                );

                return {
                  ...newborn,
                  medicinesAdministeredNewborn: updatedMedicines,
                };
              }

              return newborn;
            },
          );

          allValues = {
            ...allValues,
            newbornAssessments: updatedNewborns,
          };
        }

        // Handle immunization status changes
        if (changedValues?.newbornAssessments) {
          const newborns = allValues?.newbornAssessments || [];

          const updated = newborns.map((nb: any) => {
            const list = nb?.immunization_records || [];

            const nextList = list.map((vx: any) => {
              let status = VaccineStatus.SCHEDULED;

              if (vx?.immunization_status) status = VaccineStatus.ADMINISTERED;

              return { ...vx, status };
            });

            return { ...nb, immunization_records: nextList };
          });

          allValues = { ...allValues, newbornAssessments: updated };
        }

        const cleanedValues = {
          ...cleanupHiddenFieldsNewborn(formFields, allValues),
        };

        handleWarningCheck(changedValues, allValues);

        // Update form state
        setFormValues((prev) => {
          const nextValues = {
            ...prev,
            ...cleanedValues,
            hasAncRecord: prev.hasAncRecord ?? false,
          };

          prevFormValuesRef.current = nextValues;

           // Save to draft
          debouncedSaveDraft(nextValues);

          return nextValues;
        });
      },
    [formFields, warningFields, vaccines, form, debouncedSaveDraft],
  );

  useEffect(() => {
    return () => {
      debouncedSaveDraft.cancel?.();
    };
  }, [debouncedSaveDraft]);

  // Reset initialization flag when patient changes
  useEffect(() => {
    hasInitializedRef.current = false;
    isHydratingRef.current = false;

    return () => {
      hasInitializedRef.current = false;
      isHydratingRef.current = false;
    };
  }, [patientId]);

  // Clear draft on unmount if service is completed
  useEffect(() => {
    return () => {
      if (serviceCompleted) {
        clearDraft();
      }
    };
  }, [serviceCompleted, clearDraft]);

  const handleSave = async (
    tabKey: DeliveryTabKey,
    values: any,
    action: string,
  ) => {
    try {
      const progress_status = actionToProgressStatus(action, tabKey);
      const cleanedValues = cleanupHiddenFieldsNewborn(formFields, values);
      const updatedValues = {
        ...cleanedValues,
        appointment_id: selectedPatientData?.appointmentId,
        patient_id: Number(patientId),
      };
      const body = buildDeliveryRequestBody(
        updatedValues,
        tabKey as DeliveryTabKey,
        Boolean(tabsSavedOnce[tabKey]),
        childrenData || [],
      );

      let response;

      if (tabsSavedOnce[tabKey]) {
        const appointmentServiceId =
          selectedPatientData?.appointmentServices?.find(
            (s: any) => s.service?.name === ServiceType.DELIVERY,
          )?.id;

        if (!appointmentServiceId) {
          throw new Error("Appointment service ID not found");
        }

        response = await updateDeliveryVisit({
          appointment_service_id: appointmentServiceId,
          progress_status,
          data: body,
        }).unwrap();
      } else {
        response = await postDeliveryVisit({
          progress_status,
          data: body,
        }).unwrap();
      }

      showNotification(
        "success",
        "Delivery Service",
        tabsSavedOnce[tabKey]
          ? "Data updated successfully!"
          : "Data saved successfully!",
      );

      if (response?.referInResults && Array.isArray(response.referInResults)) {
        response.referInResults.forEach((result: any) => {
          const patientName = `${result.patient?.firstName} ${result.patient?.lastName}`;
          const doctorName = `${result.doctor?.firstName} ${result.doctor?.lastName}`;
          const serviceName = result.service?.name || "DELIVERY";
          const duration = 100;
          showNotification(
            "info",
            "Internal Referral Successful",
            `${patientName} has been referred for ${serviceName} to Dr. ${doctorName}`,
            duration,
          );
        });
      }

      // Check if this action completes the service
      const shouldCompleteService =
        (tabKey === "5" && (action === "referToCemonc" || action === "save")) ||
        (tabKey === "4" && action === "save") ||
        action === "falseLabor" ||
        (action === "lama" && tabKey === "3");

      if (shouldCompleteService) {
        const existingDeliveryService =
          selectedPatientData?.appointmentServices?.find(
            (s: any) => s.service?.name === ServiceType.DELIVERY,
          );

        const deliveryServiceSummary = {
          id: response?.id ?? existingDeliveryService?.id,
          status: SERVICES_STATUS.COMPLETED,
          service: {
            id: selectedPatientData?.selectedServiceIdFromCard,
            name: ServiceType.DELIVERY,
          },
        };

        const existingServices = selectedPatientData?.appointmentServices || [];

        const updatedAppointmentServices = existingServices.some(
          (s: any) => s.service?.name === ServiceType.DELIVERY,
        )
          ? existingServices.map((s: any) =>
              s.service?.name === ServiceType.DELIVERY
                ? { ...s, ...deliveryServiceSummary }
                : s,
            )
          : [...existingServices, deliveryServiceSummary];

        dispatch(
          setSelectedPatientData({
            ...selectedPatientData,
            appointmentServices: updatedAppointmentServices,
            appointmentStatus: SERVICES_STATUS.COMPLETED,
          }),
        );

        // Clear draft when service is completed
        clearDraft();

        if (tabKey === "5" && action === "referToCemonc") {
          navigate(`/queue`);
        } else {
          navigate(`/patient/${patientId}/services`);
        }
        return;
      }

      // For NON-COMPLETING saves: Update local state
      setTabsSavedOnce((prev) => ({ ...prev, [tabKey]: true }));
      setTabLocks((prev) => ({ ...prev, [tabKey]: true }));

      // Handle newborn-specific data
      if (tabKey === "3") {
        // Store original immunization records from response
        if (response?.newbornAssesment) {
          const newbornFromApi = transformNewbornApiToForm(
            response.newbornAssesment,
            response.deliveryPatients,
          );

          newbornFromApi.newbornAssessments?.forEach(
            (nb: any, index: number) => {
              if (nb.immunization_records?.length > 0) {
                originalNewbornDataRef.current[index] = {
                  ...nb,
                  immunization_records: [...nb.immunization_records],
                };
              }
            },
          );
        }
      }

      return response;
    } catch (error: any) {
      const backendMsg =
        error?.data?.message ||
        error?.error ||
        "Something went wrong while saving.";

      showNotification("error", "Delivery Service", backendMsg);
      throw error;
    }
  };

  if (
    isLoadingOptions ||
    isLoadingChildren ||
    isDeliveryCurrentVisitRecordLoading ||
    isPostDeliveryVisitLoading ||
    isUpdateDeliveryVisitLoading
  ) {
    return <Loader />;
  }

  return (
    <>
      <DeliveryForm
        form={form}
        formFields={formFields}
        warningModalStates={warningModalStates}
        setWarningModalStates={setWarningModalStates}
        onValuesChange={handleValuesChange}
        formValues={formValues}
        onSave={handleSave}
        isServiceCompleted={serviceCompleted}
        tabLocks={tabLocks}
        setTabLocks={setTabLocks}
        tabsSavedOnce={tabsSavedOnce}
        visitStatus={selectedPatientData?.visit?.status}
        childrenData={childrenData || []}
        hasChildren={(childrenData || []).length > 0}
        onScanEpiClick={handleOnClickQRCode}
        activeKey={activeDeliveryTab}
        setActiveKey={setActiveDeliveryTab}
      />
      <QRModal
        open={isQrOpen}
        onClose={() => {
          setIsQrOpen(false);
          setCurrentNewbornIndex(null);
        }}
        onScanSuccess={handleQrSuccess}
        title="Scan Immunisation Card QR"
      />
    </>
  );
}
