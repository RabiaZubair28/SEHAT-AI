import React, { useMemo } from "react";
import { Form, Tabs, Button } from "antd";
import TopBar from "@/components/ui/TopBar";
import { useNavigate } from "react-router-dom";
import EmergencyDetails from "./EmergencyDetails";

type EmergencyFormProps = {
  form: any;
  formFields: any[];
  handleFormValuesChange: (values: any, changedValues: any) => void;
  patientId: number;
  formDraft: any;
  notifyChangeInForm: any;
  districtOptions: any[];
  facilityOptions: any[];
  onDistrictChange: (districtId: number) => void;
  facilityPagination: {
    fetchMore: () => void;
    isLoadingMore: boolean;
  };
  onSave: () => Promise<void>;
  isSaving: boolean;
};

const EmergencyForm: React.FC<EmergencyFormProps> = ({
  form,
  formFields,
  handleFormValuesChange,
  notifyChangeInForm,
  districtOptions,
  facilityOptions,
  onDistrictChange,
  facilityPagination,
  onSave,
  isSaving,
}) => {
  const [activeKey, setActiveKey] = React.useState<string>("1");
  const [editMode] = React.useState();

  const navigate = useNavigate();

  const filteredFormFields = useMemo(() => {
    return (formFields || []).map((tab: any) => ({
      ...tab,
      fields: (tab.fields || [])
        .filter((field: any) => {
          if (!field.visibleIf) return true;
          if (typeof field.visibleIf !== "function") return true;
          const completeFormValues = form.getFieldsValue(true);
          return field.visibleIf(completeFormValues);
        })
        .map((field: any) => {
          const updatedField = { ...field };
          const completeFormValues = form.getFieldsValue(true);

          // Update district options
          if (field.name === "district") {
            updatedField.options = districtOptions;
          }

          // Update facility options
          if (field.name === "facility") {
            updatedField.options = facilityOptions;
            updatedField.fetchMore = facilityPagination.fetchMore;
            updatedField.isLoadingMore = facilityPagination.isLoadingMore;
            updatedField.disabled =
              !completeFormValues.levelOfCare || !completeFormValues.district;
          }

          return updatedField;
        }),
    }));
  }, [
    formFields,
    notifyChangeInForm,
    form,
    districtOptions,
    facilityOptions,
    facilityPagination,
  ]);

  const tabItems = [
    {
      key: "1",
      label: "Emergency Details",
      children: (
        <EmergencyDetails
          formFields={filteredFormFields}
          editMode={editMode}
          formValues={notifyChangeInForm}
        />
      ),
      forceRender: true,
    },
  ];

  return (
    <>
      <TopBar
        title="Emergency Form"
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
            });

            nextAllValues.district = undefined;
            nextAllValues.facility = undefined;

            nextChangedValues = {
              ...nextChangedValues,
              district: undefined,
              facility: undefined,
            };
          }

          if ("district" in changedValues) {
            const districtId = changedValues.district;
            onDistrictChange(districtId);

            form.setFieldsValue({
              facility: undefined,
            });

            nextAllValues.facility = undefined;

            nextChangedValues = {
              ...nextChangedValues,
              facility: undefined,
            };
          }

          handleFormValuesChange(nextChangedValues, nextAllValues);
        }}
        style={{ marginTop: "12px" }}
        form={form}
        layout="vertical"
      >
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          onChange={setActiveKey}
          items={tabItems}
        />

        <div
          style={{
            textAlign: "right",
            marginTop: 24,
            gap: "8px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button type="primary" onClick={onSave} loading={isSaving}>
            Save
          </Button>
        </div>
      </Form>
    </>
  );
};

export default EmergencyForm;
