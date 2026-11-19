import React, { useMemo } from "react";
import { Form, Tabs, Button, Spin, TabsProps } from "antd";
import TopBar from "@/components/ui/TopBar";
import WarningModal from "@/components/shared/WarningModal";
import Loader from "@/components/shared/Loader";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { clearFormData } from "@/redux/store/slices/formDataSlice";
import { useGlobalNotification } from "@/hooks/useNotification";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import {
  SERVICES_STATUS,
  ServiceType,
  VISIT_STATUS,
} from "../../data/constants";
import ImmunnisationDetails from "./ImmunisationDetails";
import { usePostImmunisationRecordMutation } from "../../services/immunisationServiceApi";
import { transformFormDataToImmunisationApi } from "../../utils/immunisationTransformers";
import { LOCATION_FIELDS } from "../../data/immunisationConstants";

type WarningModalState = {
  message: string[];
  visible: boolean;
};

type ImmunisationFormProps = {
  form: any;
  formFields: any[];
  womenFormFields: any[];
  patientAge: number | null;
  handleFormValuesChange: (values: any, changedValues: any) => void;
  patientId: number;
  formDraft: any;
  notifyChangeInForm: any;
  isServiceCompleted: boolean;
  warningModalStates: WarningModalState;
  isVaccinesLoading: boolean;
  isWomenVaccinesLoading: boolean;
  hasPreviousVisitData: boolean;
  initialFacilityOption: any;
  setWarningModalStates: React.Dispatch<
    React.SetStateAction<WarningModalState>
  >;

  districtOptions: any[];
  facilityOptions: any[];
  talukaOptions: any[];
  onDistrictChange: (districtId: number) => void;
  facilityPagination: {
    fetchMore: () => void;
    isLoadingMore: boolean;
  };
};

const ImmunisationForm: React.FC<ImmunisationFormProps> = ({
  form,
  formFields,
  womenFormFields,
  patientAge,
  formDraft,
  handleFormValuesChange,
  isServiceCompleted,
  warningModalStates,
  notifyChangeInForm,
  setWarningModalStates,
  patientId,
  isVaccinesLoading,
  isWomenVaccinesLoading,
  districtOptions,
  facilityOptions,
  onDistrictChange,
  facilityPagination,
  talukaOptions,
  hasPreviousVisitData,
  initialFacilityOption,
}) => {
  const [activeKey, setActiveKey] = React.useState<string>("child");
  const [editMode, setEditMode] = React.useState(
    !isServiceCompleted || Object.keys(formDraft || {}).length > 0,
  );

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const showNotification = useGlobalNotification();

  const [postImmunisationRecord, { isLoading: isPostLoading }] =
    usePostImmunisationRecordMutation();

  const selectedPatientData = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData,
  );

  const isPreviousVisitPrefilled =
    !isServiceCompleted &&
    Object.keys(formDraft || {}).length === 0 &&
    hasPreviousVisitData;

  const filteredChildFormFields = useMemo(() => {
    return (formFields || []).map((tab: any) => {
      const completeFormValues = form.getFieldsValue(true);

      const allLocationFieldsFilled = LOCATION_FIELDS.every((f) => {
        const fieldDef = (tab.fields || []).find((fd: any) => fd.name === f);

        if (fieldDef?.visibleIf && typeof fieldDef.visibleIf === "function") {
          if (!fieldDef.visibleIf(completeFormValues)) return true;
        }

        return !!completeFormValues[f];
      });

      return {
        ...tab,
        fields: (tab.fields || [])
          .filter((field: any) => {
            if (!field.visibleIf) return true;
            if (typeof field.visibleIf !== "function") return true;
            return field.visibleIf(completeFormValues);
          })
          .map((field: any) => {
            const updatedField = { ...field };

            // Update district options
            if (field.name === "district") {
              updatedField.options = districtOptions;
            }

            // Update facility options
            if (field.name === "facility") {
              updatedField.options = facilityOptions;
              updatedField.fetchMore = facilityPagination.fetchMore;
              updatedField.isLoadingMore = facilityPagination.isLoadingMore;
              if (
                initialFacilityOption &&
                !updatedField.options.some(
                  (o: any) =>
                    String(o.value) === String(initialFacilityOption.value),
                )
              ) {
                updatedField.options = [
                  initialFacilityOption,
                  ...updatedField.options,
                ];
              }
            }

            if (field.name === "taluka") {
              updatedField.options = talukaOptions;
            }

            if (
              isPreviousVisitPrefilled &&
              field.name !== "immunization_records"
            ) {
              updatedField.disabled = !!completeFormValues[field.name];
            }

            // ES-775: Lock location fields only when all visible ones are filled
            if (LOCATION_FIELDS.includes(field.name)) {
              updatedField.disabled = allLocationFieldsFilled && isPreviousVisitPrefilled;
            }

            return updatedField;
          }),
      };
    });
  }, [
    formFields,
    notifyChangeInForm,
    form,
    districtOptions,
    facilityOptions,
    facilityPagination,
    talukaOptions,
  ]);

  const filteredWomenFormFields = useMemo(() => {
    return (womenFormFields || []).map((tab: any) => ({
      ...tab,
      fields: (tab.fields || []).map((field: any) => ({
        ...field,
      })),
    }));
  }, [womenFormFields, notifyChangeInForm]);

  const activeFormFields =
    activeKey === "women" ? filteredWomenFormFields : filteredChildFormFields;

  const showWomenVaccination =
    typeof patientAge === "number" && patientAge >= 9 && patientAge <= 50;

  const validateCurrentTab = async () => {
    const currentTab = activeFormFields.find((tab: any) => tab.tabKey === "1");
    const values = form.getFieldsValue(true);

    const fieldNames: any[] = [];

    currentTab?.fields?.forEach((field: any) => {
      if (field.type === "formList") {
        const listName = field.name;
        (values[listName] || []).forEach((_: any, index: number) => {
          field.fields.forEach((childField: any) => {
            fieldNames.push([listName, index, childField.name]);
          });
        });
      } else if (field.name) {
        fieldNames.push(field.name);
      }
    });

    try {
      await form.validateFields(fieldNames);
      return { isValid: true as const };
    } catch (errorInfo: any) {
      // Scroll to first error in current tab
      setTimeout(() => {
        form.scrollToField(errorInfo?.errorFields?.[0]?.name, {
          behavior: "smooth",
          block: "center",
        });
      }, 100);

      return { isValid: false as const };
    }
  };

  const handleSubmit = async () => {
    if (!editMode) return;

    const validation = await validateCurrentTab();
    if (!validation.isValid) {
      return;
    }

    const completeFormValues = form.getFieldsValue(true);

    try {
      const payload = transformFormDataToImmunisationApi(
        completeFormValues,
        selectedPatientData?.appointmentId ?? undefined,
        activeKey === "women"
          ? {
              recordsFieldName: "women_immunization_records",
              includeCardDetails: false,
            }
          : undefined,
      );

      const response = await postImmunisationRecord(payload).unwrap();

      showNotification(
        "success",
        "Immunisation Record",
        isServiceCompleted
          ? "Immunisation record updated successfully"
          : "Immunisation record saved successfully",
      );

      const existingService = selectedPatientData?.appointmentServices?.find(
        (s: any) => s.service?.name === ServiceType.IMMUNISATION,
      );

      const serviceSummary = {
        id: response?.id ?? existingService?.id,
        status: SERVICES_STATUS.COMPLETED,
        service: {
          id: selectedPatientData?.selectedServiceIdFromCard,
          name: ServiceType.IMMUNISATION,
        },
      };

      const existingServices = selectedPatientData?.appointmentServices || [];
      const updatedAppointmentServices = existingServices.some(
        (s: any) => s.service?.name === ServiceType.IMMUNISATION,
      )
        ? existingServices.map((s: any) =>
            s.service?.name === ServiceType.IMMUNISATION
              ? { ...s, ...serviceSummary }
              : s,
          )
        : [...existingServices, serviceSummary];

      dispatch(
        setSelectedPatientData({
          ...selectedPatientData,
          appointmentServices: updatedAppointmentServices,
          appointmentStatus: SERVICES_STATUS.COMPLETED,
        }),
      );

      setEditMode(false);

      dispatch(
        clearFormData({
          formKey: `immunisationForm`,
          patientId,
        }),
      );

      navigate(`/patient/${patientId}/services`);
    } catch (error: any) {
      const apiMsg = error?.data?.message;

      if (Array.isArray(apiMsg)) {
        showNotification("error", "Immunisation Record", apiMsg.join(", "));
        return;
      }

      const message =
        apiMsg || error?.message || "Immunisation submission failed";

      showNotification("error", "Immunisation Record", message);
    }
  };

  const tabItems: TabsProps["items"] = [];

  tabItems.push({
    key: "child",
    label: "Immunisation",
    children: (
      <Spin spinning={isVaccinesLoading}>
        <ImmunnisationDetails
          formFields={filteredChildFormFields}
          editMode={editMode}
          formValues={notifyChangeInForm}
        />
      </Spin>
    ),
    forceRender: true,
  });

  if (showWomenVaccination) {
    tabItems.push({
      key: "women",
      label: "Women vaccination",
      children: (
        <Spin spinning={isWomenVaccinesLoading}>
          <ImmunnisationDetails
            formFields={filteredWomenFormFields}
            editMode={editMode}
            formValues={notifyChangeInForm}
          />
        </Spin>
      ),
      forceRender: true,
    });
  }

  React.useEffect(() => {
    if (!tabItems.length) return;

    const activeTabStillVisible = tabItems.some(
      (tab: any) => tab.key === activeKey,
    );
    if (!activeTabStillVisible) {
      setActiveKey(tabItems[0]?.key);
    }
  }, [activeKey, tabItems]);

  if (isPostLoading) {
    return <Loader />;
  }

  return (
    <>
      <WarningModal
        visible={warningModalStates.visible}
        message={warningModalStates.message}
        onClose={() =>
          setWarningModalStates({ ...warningModalStates, visible: false })
        }
      />

      <TopBar
        title="Immunisation"
        onIconClick={() => navigate(-1)}
        showPatientInfo={true}
        showIconButton={true}
      />

      <Form
        onValuesChange={(changedValues, allValues) => {
          let nextAllValues = { ...allValues };
          let nextChangedValues = { ...changedValues };

          // When levelOfCare changes, clear district + facility
          if ("levelOfCare" in changedValues) {
            form.setFieldsValue({
              district: undefined,
              facility: undefined,
              otherFacility: undefined,
            });

            nextAllValues.district = undefined;
            nextAllValues.facility = undefined;
            nextAllValues.otherFacility = undefined;

            nextChangedValues = {
              ...nextChangedValues,
              district: undefined,
              facility: undefined,
              otherFacility: undefined,
            };
          }

          // When district changes, trigger facility fetch and clear facility
          if ("district" in changedValues) {
            const districtId = changedValues.district;
            onDistrictChange(districtId);

            form.setFieldsValue({
              facility: undefined,
              otherFacility: undefined,
              taluka: undefined,
            });

            nextAllValues.facility = undefined;
            nextAllValues.otherFacility = undefined;
            nextAllValues.taluka = undefined;

            nextChangedValues = {
              ...nextChangedValues,
              facility: undefined,
              otherFacility: undefined,
              taluka: undefined,
            };
          }

          handleFormValuesChange(nextChangedValues, nextAllValues);
        }}
        style={{ marginTop: "12px" }}
        form={form}
        layout="vertical"
      >
        {tabItems.length > 0 ? (
          <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            items={tabItems}
          />
        ) : null}

        {selectedPatientData?.visit?.status !== VISIT_STATUS.DISPATCHED && (
          <div style={{ textAlign: "right", marginTop: 24 }}>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isPostLoading}
              disabled={!editMode}
            >
              Save
            </Button>
          </div>
        )}
      </Form>
    </>
  );
};

export default ImmunisationForm;
