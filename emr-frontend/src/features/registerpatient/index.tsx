
import React, { useEffect, useMemo, useState } from "react";
import { Form, Tabs, Button, Row, Col } from "antd";
import TopBar from "@/components/ui/TopBar";
import { useNavigate } from "react-router-dom";
import { usePermissionCheck } from "@/hooks/usePermission";
import { ROUTE_KEYS } from "@/data/routeKey";
import { ROUTES } from "@/data/routes";
import { HttpStatus, PatientFormValues } from "@/data/types";
import { mapPatientFormValuesToPayload } from "./utils/helpers";
import { useAddPatientMutation } from "./services/patientRegisterServices";
import {
  PATIENT_MESSAGES,
  PatientFieldNames,
} from "./data/constants";
import { useGlobalNotification } from "@/hooks/useNotification";
import usePatientRegistration from "./components/usePatientRegistrationHook";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";
import { groupFieldsByRow } from "@/utils/helpers/formHelperMethods";
import { calculateAgeByDob } from "@/utils/ageCalculator";
import Loader from "@/components/shared/Loader";
import QRModal from "@/components/shared/QRModal";
import { clearSelectedPatientData } from "@/redux/store/slices/patientSlice";
import { useDispatch } from "react-redux";

import {
  PatientRegistrationVoice,
  matchOption,
  mapVoiceToPatientForm,
  type ExtractionResult,
  type FieldQuality,
  type MatchableOption,
  type FormTabDefinition,
  type PatientRegistrationSection,
} from "@sehat-voice";

type LocationName =
  | "division_id"
  | "district_id"
  | "taluka_id"
  | "uc_id";

type LocationField = {
  name: string;
  options?:
  | MatchableOption[]
  | ((values: Record<string, unknown>) => MatchableOption[]);
  onChange?: (value: number) => void;
};

type PendingLocation = {
  names: Partial<Record<LocationName, string>>;
  step: number;
};

const LOCATION_ORDER: LocationName[] = [
  "division_id",
  "district_id",
  "taluka_id",
  "uc_id",
];

function getLocationOptions(
  field: LocationField | undefined,
  values: Record<string, unknown>
): MatchableOption[] {
  if (!field?.options) return [];

  return typeof field.options === "function"
    ? field.options(values) ?? []
    : field.options;
}

function collectLocations(
  extraction: ExtractionResult
): Partial<Record<LocationName, string>> {
  const locations: Partial<Record<LocationName, string>> = {};

  for (const name of LOCATION_ORDER) {
    const reference = extraction.references?.[name];
    const extracted = extraction.fields?.[name];

    const spoken =
      reference?.spoken_label ??
      extracted?.raw_value ??
      extracted?.value;

    if (spoken !== undefined && spoken !== null) {
      const value = String(spoken).trim();

      if (value) locations[name] = value;
    }
  }

  return locations;
}

const PatientForm: React.FC = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm<PatientFormValues>();
  const navigate = useNavigate();

  const [addPatient, { isLoading }] =
    useAddPatientMutation();

  const hasAccess = usePermissionCheck(
    ROUTE_KEYS.CREATE_A_NEW_PATIENT
  );

  const showNotification = useGlobalNotification();

  const {
    formFields,
    showQRModal,
    setShowQRModal,
    isLocationLoading,
  } = usePatientRegistration();

  const [activeKey, setActiveKey] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceQuality, setVoiceQuality] =
    useState<Record<string, FieldQuality>>({});
  const [pendingLocation, setPendingLocation] =
    useState<PendingLocation | null>(null);

  const section: PatientRegistrationSection =
    activeKey === "1"
      ? "personal_details"
      : "sociodemographic_details";

  const locationFields = useMemo(() => {
    const map = new Map<string, LocationField>();

    for (const field of formFields[0]?.fields ?? []) {
      map.set(String(field.name), field as LocationField);
    }

    return map;
  }, [formFields]);

  useEffect(() => {
    if (!pendingLocation) return;

    const { names, step } = pendingLocation;

    if (step >= LOCATION_ORDER.length) {
      setPendingLocation(null);
      return;
    }

    const name = LOCATION_ORDER[step];
    const spoken = names[name];

    if (!spoken) {
      setPendingLocation({
        ...pendingLocation,
        step: step + 1,
      });
      return;
    }

    const field = locationFields.get(name);

    if (!field) {
      setPendingLocation(null);
      return;
    }

    if (isLocationLoading) return;

    const options = getLocationOptions(
      field,
      form.getFieldsValue(true)
    );

    if (!options.length) {
      // Parent's options may still be loading.
      return;
    }

    const match = matchOption(spoken, options, {
      threshold: 0.78,
      minimumGap: 0.1,
    });

    if (match.status !== "matched") {
      // Ambiguous/missing locations remain unselected.
      setPendingLocation(null);
      return;
    }

    const id = Number(match.option.value);

    if (!Number.isFinite(id)) {
      setPendingLocation(null);
      return;
    }

    form.setFieldValue(name, id);

    if (name === "division_id") {
      form.setFieldsValue({
        district_id: undefined,
        taluka_id: undefined,
        uc_id: undefined,
      });
    } else if (name === "district_id") {
      form.setFieldsValue({
        taluka_id: undefined,
        uc_id: undefined,
      });
    } else if (name === "taluka_id") {
      form.setFieldValue("uc_id", undefined);
    }

    // Triggers the original EMR dependent location API.
    field.onChange?.(id);

    setPendingLocation({
      ...pendingLocation,
      step: step + 1,
    });
  }, [
    pendingLocation,
    locationFields,
    isLocationLoading,
    form,
  ]);

  const handleVoiceApply = (
    result: ExtractionResult,
    recordedSection: PatientRegistrationSection
  ) => {
    const tabKey =
      recordedSection === "personal_details" ? "1" : "2";

    const mapping = mapVoiceToPatientForm(
      result,
      formFields as unknown as FormTabDefinition[],
      tabKey,
      form.getFieldsValue(true)
    );

    const values = { ...mapping.values };

    if (typeof values.dob === "string") {
      values.age = calculateAgeByDob(values.dob);
    }

    if (values.nationalityStatus === "Non-Pakistani") {
      form.setFieldsValue({
        cnic_provider: undefined,
        cnic: undefined,
      });
    }

    if (values.cnic_provider === "CNIC Not Available") {
      form.setFieldValue("cnic", undefined);
      delete values.cnic;
    }

    form.setFieldsValue(values);

    setVoiceQuality((previous) => {
      const updated = { ...previous };

      Object.keys(values).forEach((name) => {
        delete updated[name];
      });

      return { ...updated, ...mapping.quality };
    });

    setActiveKey(tabKey);

    // AI proposals cannot choose location IDs via the legacy fuzzy matcher.
    // Locations stay unchanged; the user selects them in the EMR dropdowns.
    if (result.engine === "ai") {
      setPendingLocation(null);
      return;
    }

    if (recordedSection === "personal_details") {
      const locations = collectLocations(result);

      if (Object.keys(locations).length) {
        // Clearing children prevents mixing old and new locations.
        form.setFieldsValue({
          division_id: undefined,
          district_id: undefined,
          taluka_id: undefined,
          uc_id: undefined,
        });

        setPendingLocation({
          names: locations,
          step: 0,
        });
      }
    }
  };

  const dob = Form.useWatch("dob", form);
  const nationality = Form.useWatch(
    "nationalityStatus",
    form
  );
  const cnicProvider = Form.useWatch(
    PatientFieldNames.CNICProvider,
    form
  );

  const filteredFormFields = useMemo(() => {
    return formFields.map((tab: any) => ({
      ...tab,
      fields: (tab.fields ?? []).filter((field: any) => {
        const values = form.getFieldsValue(true);

        if (
          field.name === PatientFieldNames.CNIC &&
          !values.nationalityStatus
        ) {
          return true;
        }

        if (typeof field.visibleIf === "function") {
          return field.visibleIf(values);
        }

        return true;
      }),
    }));
  }, [
    formFields,
    dob,
    nationality,
    cnicProvider,
    form,
  ]);

  const validateCompleteForm = async (): Promise<boolean> => {
    try {
      const required = formFields.flatMap((tab) =>
        tab.fields
          .filter((field: any) => field.required)
          .map((field: any) => field.name)
      );

      await form.validateFields(required);
      return true;
    } catch (errorInfo: any) {
      const firstError =
        errorInfo.errorFields?.[0]?.name?.[0];

      if (firstError) {
        const tab = formFields.find((item) =>
          item.fields.some(
            (field: any) => field.name === firstError
          )
        );

        if (tab) setActiveKey(tab.key);
        form.scrollToField(firstError);
      }

      showNotification(
        "error",
        "Incomplete Form",
        `Please check required fields. First error: ${firstError || "Unknown field"
        }`
      );

      return false;
    }
  };

  const validateCurrentTab = async (
    key: string
  ): Promise<boolean> => {
    const tab = formFields.find((item) => item.key === key);

    if (!tab) return false;

    try {
      await form.validateFields(
        tab.fields
          .filter((field: any) => field.required)
          .map((field: any) => field.name)
      );

      return true;
    } catch {
      showNotification(
        "error",
        "Incomplete Information",
        "Please fill all required fields in the current tab before proceeding."
      );

      return false;
    }
  };

  const isLastTab = () =>
    formFields.findIndex(
      (tab) => tab.key === activeKey
    ) ===
    formFields.length - 1;

  const handleFinalSubmit = async () => {
    if (!(await validateCompleteForm())) return;

    setIsSubmitting(true);

    try {
      const values = form.getFieldsValue(true);
      const payload = mapPatientFormValuesToPayload(values);
      const response = await addPatient(payload).unwrap();

      if (
        response?.status === HttpStatus.OK ||
        response?.status === HttpStatus.CREATED
      ) {
        const apiData = response.data;

        showNotification(
          PATIENT_MESSAGES.SUCCESS.type,
          PATIENT_MESSAGES.SUCCESS.title,
          apiData?.message ||
          PATIENT_MESSAGES.SUCCESS.description
        );

        dispatch(clearSelectedPatientData());

        navigate(ROUTES.REFERRAL, {
          state: { patientId: apiData?.id },
        });

        return;
      }

      const message =
        response?.data?.response?.message ||
        response?.data?.message ||
        response?.message ||
        PATIENT_MESSAGES.FAILURE.description;

      showNotification(
        PATIENT_MESSAGES.FAILURE.type,
        PATIENT_MESSAGES.FAILURE.title,
        message
      );
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";

      showNotification(
        PATIENT_MESSAGES.FAILURE.type,
        PATIENT_MESSAGES.FAILURE.title,
        message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextOrSubmit = async () => {
    if (isLastTab()) {
      await handleFinalSubmit();
      return;
    }

    if (!(await validateCurrentTab(activeKey))) return;

    const currentIndex = formFields.findIndex(
      (tab) => tab.key === activeKey
    );

    if (currentIndex < formFields.length - 1) {
      setActiveKey(formFields[currentIndex + 1].key);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <>
      {isLocationLoading && <Loader />}

      <QRModal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        onScanSuccess={(value) => {
          form.setFieldValue(
            PatientFieldNames.QR_Number,
            value
          );
        }}
      />

      <TopBar
        title="Patient Registration"
        showIconButton
        onIconClick={() => navigate(ROUTES.SEARCH_PATIENT)}
      />

      <PatientRegistrationVoice
        apiBaseUrl={
          import.meta.env.VITE_SEHAT_AI_URL ||
          "http://127.0.0.1:8006"
        }
        section={section}
        mode={import.meta.env.VITE_SEHAT_INTERPRET_ENABLED === "1" ? "ai" : "legacy"}
        onApply={handleVoiceApply}
      />

      <style>
        {`
          .sehat-review .ant-input,
          .sehat-review .ant-input-number,
          .sehat-review .ant-picker,
          .sehat-review .ant-select-selector {
            border-color: #e9b949 !important;
          }
          .sehat-invalid .ant-input,
          .sehat-invalid .ant-input-number,
          .sehat-invalid .ant-picker,
          .sehat-invalid .ant-select-selector {
            border-color: #e45b5b !important;
          }
        `}
      </style>

      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 12 }}
        onValuesChange={(changed) => {
          setVoiceQuality((previous) => {
            const updated = { ...previous };

            Object.keys(changed).forEach((name) => {
              delete updated[name];
            });

            return updated;
          });

          if (changed.dob) {
            form.setFieldsValue({
              age: calculateAgeByDob(changed.dob),
            });
          }

          if (changed.division_id !== undefined) {
            setPendingLocation(null);
            form.setFieldsValue({
              district_id: undefined,
              taluka_id: undefined,
              uc_id: undefined,
            });
          }

          if (changed.district_id !== undefined) {
            setPendingLocation(null);
            form.setFieldsValue({
              taluka_id: undefined,
              uc_id: undefined,
            });
          }

          if (changed.taluka_id !== undefined) {
            setPendingLocation(null);
            form.setFieldValue("uc_id", undefined);
          }

          if (
            changed.nationalityStatus === "Non-Pakistani"
          ) {
            form.setFieldsValue({
              cnic_provider: undefined,
              cnic: undefined,
            });
          }

          if (changed.nationalityStatus === "Pakistani") {
            form.setFieldsValue({
              cnic_provider: undefined,
              international_id: undefined,
            });
          }

          if (
            changed.cnic_provider === "CNIC Not Available"
          ) {
            form.setFieldValue("cnic", undefined);
          }
        }}
      >
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={filteredFormFields.map((tab) => {
            const rows = groupFieldsByRow(tab.fields ?? []);

            return (
              {
                key: tab.key,
                label: tab.title,
                children: rows.length ? rows.map((rowFields, rowIndex) => (
                  <Row gutter={16} key={`row-${rowIndex}`}>
                    {rowFields.map((field) => {
                      const quality =
                        voiceQuality[String(field.name)];

                      const qualityClass =
                        quality === "invalid"
                          ? "sehat-invalid"
                          : quality === "review"
                            ? "sehat-review"
                            : "";

                      return (
                        <Col
                          key={field.name}
                          className={qualityClass}
                          xs={24}
                          sm={24}
                          md={field.colSpan || 8}
                          lg={field.colSpan || 8}
                        >
                          {FormGenerator({
                            ...field,
                            formValues:
                              form.getFieldsValue(true),
                          })}
                        </Col>
                      );
                    })}
                  </Row>
                )) : <div>No fields to display</div>,
              }
            );
          })}
        />

        <div
          style={{
            textAlign: "right",
            marginTop: 24,
          }}
        >
          <Button
            type="primary"
            onClick={handleNextOrSubmit}
            disabled={!hasAccess}
            loading={isSubmitting}
          >
            {isLastTab()
              ? "Register patient and continue to assign service"
              : "Next"}
          </Button>
        </div>
      </Form>
    </>
  );
};

export default PatientForm;
